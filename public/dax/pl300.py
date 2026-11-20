"""PL-300 Studio glue for the DAX engine (dax.py, run in the same namespace).

Builds a small Adventure-Works-style star schema matching the PL-300 lab
wording (Sales, Product, Customer, 'Date', DimEmployee), then runs a learner's
formula next to the reference answer and compares them cell by cell, the way
a Power BI matrix would show them.
"""

import json as _pjson
import numpy as _pnp
import pandas as _ppd

# ── Sample model ────────────────────────────────────────────────────

def _pl300_frames():
    rng = _pnp.random.default_rng(300)          # fixed seed: the same numbers every load

    product = _ppd.DataFrame({
        "ProductKey": list(range(1, 10)),
        "ProductName": ["Road-150", "Mountain-200", "Touring-1000", "Helmet", "Bottle Cage",
                        "Tire Tube", "Jersey", "Gloves", "Bib Shorts"],
        "Category": ["Bikes", "Bikes", "Bikes", "Accessories", "Accessories",
                     "Accessories", "Clothing", "Clothing", "Clothing"],
        "UnitPrice": [1800.0, 1250.0, 950.0, 35.0, 9.0, 5.0, 50.0, 25.0, 70.0],
        "MarginTier": ["High", "High", "Medium", "High", "Low", "Low", "Medium", "Low", "Medium"],
    })

    customer = _ppd.DataFrame({
        "CustomerKey": list(range(1, 9)),
        "CustomerName": ["Alpine Cycles", "Bay Riders", "City Spokes", "Delta Sports",
                         "Eastside Bikes", "Fjord Outdoor", "Granite Gear", "Harbor Wheels"],
        "Region": ["North", "West", "East", "South", "East", "North", "West", "South"],
    })

    days = _ppd.date_range("2023-01-01", "2024-12-31", freq="D")
    date = _ppd.DataFrame({
        "Date": days,
        "Year": days.year,
        "Quarter": "Q" + days.quarter.astype(str),
        "YearQuarter": days.year.astype(str) + " Q" + days.quarter.astype(str),
        "Month": days.month,
        "MonthName": days.month_name(),
        "YearMonth": days.strftime("%Y-%m"),
    })

    n = 180
    order_dates = _ppd.to_datetime("2023-01-01") + _ppd.to_timedelta(
        _pnp.sort(rng.integers(0, 731 - 30, n)), unit="D")
    ship_dates = order_dates + _ppd.to_timedelta(rng.integers(3, 35, n), unit="D")
    pkeys = rng.choice(product["ProductKey"], n, p=[.08, .1, .1, .14, .12, .12, .12, .1, .12])
    ckeys = rng.integers(1, 9, n)
    qty = rng.integers(1, 6, n)
    list_price = product.set_index("ProductKey").loc[pkeys, "UnitPrice"].to_numpy()
    discount = rng.choice([0.0, 0.0, 0.05, 0.1], n)
    sales = _ppd.DataFrame({
        "SalesKey": list(range(1, n + 1)),
        "OrderDate": order_dates,
        "ShipDate": ship_dates,
        "ProductKey": pkeys,
        "CustomerKey": ckeys,
        "OrderQty": qty,
        "SalesAmount": _pnp.round(qty * list_price * (1 - discount), 2),
    })

    employee = _ppd.DataFrame({
        "EmployeeKey": [1, 2, 3, 4],
        "EmployeeName": ["Ana Silva", "Ben Okoro", "Chloe Park", "Dev Shah"],
        "EmailAddress": ["ana@contoso.com", "ben@contoso.com", "chloe@contoso.com", "dev@contoso.com"],
        "Region": ["North", "West", "East", "South"],
    })

    return {"Sales": sales, "Product": product, "Customer": customer, "Date": date, "DimEmployee": employee}


PL300_RELATIONSHIPS = [
    ("Sales", "ProductKey", "Product", "ProductKey"),
    ("Sales", "CustomerKey", "Customer", "CustomerKey"),
    ("Sales", "OrderDate", "Date", "Date"),
]
PL300_INACTIVE = [("Sales", "ShipDate", "Date", "Date")]
PL300_HELPERS = {"Total Sales": "SUM(Sales[SalesAmount])"}
PL300_USERS = ["ben@contoso.com", "dev@contoso.com", "visitor@fabrikam.com"]

_PL300_FRAMES = None


def _pl300_model(user=None):
    global _PL300_FRAMES
    if _PL300_FRAMES is None:
        _PL300_FRAMES = _pl300_frames()
    return Model(dict(_PL300_FRAMES), PL300_RELATIONSHIPS, inactive=PL300_INACTIVE,
                 date_key=("Date", "Date"), user=user)


def pl300_tables(rows=5):
    """Every table, its row count and first rows, for the model explorer."""
    model = _pl300_model()
    out = []
    for name, df in model.tables.items():
        head = df.head(rows)
        out.append({
            "name": name,
            "count": len(df),
            "header": [str(c) for c in df.columns],
            "rows": [[_peek(_py(v)) for v in r] for r in head.itertuples(index=False)],
        })
    rels = ["%s[%s] → %s[%s]" % r for r in PL300_RELATIONSHIPS]
    rels += ["%s[%s] → %s[%s] (inactive)" % r for r in PL300_INACTIVE]
    return _pjson.dumps({"tables": out, "relationships": rels,
                         "measures": ["[%s] = %s" % kv for kv in PL300_HELPERS.items()]})


def _peek(v):
    if v is None:
        return None
    if isinstance(v, _ppd.Timestamp):
        return v.strftime("%Y-%m-%d")
    return v if isinstance(v, str) else _fmt(v)


# ── Running a lab ───────────────────────────────────────────────────

def _err_text(err):
    return str(err) if isinstance(err, DaxError) else _unexpected(err)


def _helpers_engine(model, extra):
    measures = {name: parse_expr(src) for name, src in PL300_HELPERS.items()}
    measures.update(extra)
    return Engine(model, measures)


_NAME_HEAD = _dre.compile(r"^(\s*)([^\[\]'\"=(),\n]+?)\s*(:?=)(?!=)")


def _bracket_name(code):
    """Power BI lets a measure be called "% of All" or "High-Margin Sales";
    the engine's parser reads a bare name as words, so bracket it first."""
    m = _NAME_HEAD.match(code)
    if not m or _dre.fullmatch(r"[A-Za-z_][A-Za-z0-9_ ]*", m.group(2).strip()):
        return code
    return "%s[%s] %s%s" % (m.group(1), m.group(2).strip(), m.group(3), code[m.end():])


def _measure_run(code, reference, rows):
    model = _pl300_model()
    code, reference = _bracket_name(code), _bracket_name(reference)
    statements = parse_script(code)
    mine = [s for s in statements if s[0] == "measure"]
    if not mine:
        raise DaxError("Write it as a measure: Name = expression.")
    name, ast = mine[-1][1], mine[-1][2]
    if name.lower() in {k.lower() for k in PL300_HELPERS}:
        raise DaxError("[%s] already exists in the model. Give your measure its own name." % name)
    ref_stmt = [s for s in parse_script(reference) if s[0] == "measure"][-1]
    yours = _helpers_engine(model, {s[1]: s[2] for s in mine})
    ref = _helpers_engine(model, {name: ref_stmt[2]})
    cols = [_col_of(ref, r) for r in rows]
    shown = ["Total Sales", name] if name.lower() != "total sales" else [name]

    want_order, want = _grid(ref, shown, cols)
    exp_block = _table_block(([c for _, c in want_order] if cols else [""]) + shown,
                             [list(l) + v for l, v in want])
    result = {"measure": name, "expected": exp_block}
    try:
        got_order, got = _grid(yours, shown, cols)
    except Exception as err:
        result.update(ok=False, error=_err_text(err),
                      summary="Your formula raised an error when the matrix ran it.")
        return result
    got_block = _table_block(([c for _, c in got_order] if cols else [""]) + shown,
                             [list(l) + v for l, v in got])
    result["got"] = got_block

    got_map = {labels: vals[-1] for labels, vals in got}
    cells, wrong = 0, []
    for labels, vals in want:
        cells += 1
        if not _same_cell(got_map.get(labels), vals[-1]):
            wrong.append((labels, got_map.get(labels), vals[-1]))
    result["cells"] = cells
    result["wrongRows"] = [" · ".join(_text(v) for v in l if v != "") or "Total" for l, _, _ in wrong]
    if not wrong:
        result.update(ok=True, summary="Matches the reference answer in all %d cells." % cells)
    else:
        l, g, w = wrong[0]
        where = " · ".join(_text(v) for v in l if v != "") or "the total"
        result.update(ok=False, summary="%d of %d cells differ. At %s you get %s; the answer gives %s." % (
            len(wrong), cells, where, _fmt(g), _fmt(w)))
    return result


def _rls_visible(expr_ast, user):
    model = _pl300_model(user=user)
    engine = Engine(model, {})
    t = "DimEmployee"
    root = Ctx(model)
    keep = []
    for i in range(len(model.tables[t])):
        if _truthy(engine.scalar(expr_ast, root.derive(rows={t: i}))):
            keep.append(i)
    return [model.tables[t].at[i, "EmployeeName"] for i in keep]


def _rls_run(code, reference):
    # A role filter (DimEmployee[EmailAddress] = USERPRINCIPALNAME()) is a
    # true/false expression worked out for each DimEmployee row.
    expr = parse_expr(code.strip())
    ref = parse_expr(reference)
    rows_want, rows_got, wrong = [], [], 0
    for user in PL300_USERS:
        w = _rls_visible(ref, user)
        try:
            g = _rls_visible(expr, user)
        except Exception as err:
            return {"ok": False, "error": _err_text(err),
                    "summary": "Your role filter raised an error for %s." % user}
        rows_want.append([user, ", ".join(w) or "(no rows)"])
        rows_got.append([user, ", ".join(g) or "(no rows)"])
        wrong += (w != g)
    header = ["Signed in as", "DimEmployee rows visible"]
    result = {"measure": "Role filter", "expected": _table_block(header, rows_want),
              "got": _table_block(header, rows_got), "cells": len(PL300_USERS)}
    if wrong:
        result.update(ok=False, summary="%d of %d users see the wrong rows." % (wrong, len(PL300_USERS)))
    else:
        result.update(ok=True, summary="Each user sees exactly their own row, as the answer does.")
    return result


def pl300_run(payload):
    """payload: JSON {code, reference, rows: ["Table[Column]", ...], kind: "measure"|"rls"}"""
    p = _pjson.loads(payload)
    try:
        if p.get("kind") == "rls":
            out = _rls_run(p["code"], p["reference"])
        else:
            out = _measure_run(p["code"], p["reference"], p.get("rows") or [])
    except DaxError as err:
        out = {"ok": False, "error": str(err), "summary": "Your formula couldn't run."}
    except Exception as err:
        out = {"ok": False, "error": _unexpected(err), "summary": "Your formula couldn't run."}
    return _pjson.dumps(out)
