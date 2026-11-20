/* DAX engine worker for PL-300 Studio.
 *
 * Loads Pyodide + pandas on first use, then the DAX engine ported from
 * databites (dax.py) and the PL-300 sample model (pl300.py). Everything runs
 * in the browser; nothing is sent anywhere.
 *
 * Messages in:  { id, type: 'init' | 'tables' | 'run', payload? }
 * Messages out: { id, ok: true, result } | { id, ok: false, error }
 *               { type: 'status', text }   (loading progress)
 */
/* global loadPyodide */

const PYODIDE_VERSION = '0.28.3';
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const here = self.location.href.replace(/[^/]*$/, '');

let ready = null;

function status(text) {
  self.postMessage({ type: 'status', text });
}

async function fetchText(name) {
  const res = await fetch(here + name, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Couldn't load ${name} (${res.status}).`);
  return res.text();
}

function boot() {
  if (!ready) {
    ready = (async () => {
      status('Downloading Python runtime…');
      self.importScripts(INDEX_URL + 'pyodide.js');
      const py = await loadPyodide({ indexURL: INDEX_URL });
      status('Loading pandas…');
      await py.loadPackage(['numpy', 'pandas'], { messageCallback: () => {} });
      status('Starting the DAX engine…');
      const [engine, glue] = await Promise.all([fetchText('dax.py'), fetchText('pl300.py')]);
      py.globals.set('_engine_src', engine);
      py.globals.set('_glue_src', glue);
      py.runPython(`
_dax_ns = {"__name__": "dax"}
exec(compile(_engine_src, "dax.py", "exec"), _dax_ns)
exec(compile(_glue_src, "pl300.py", "exec"), _dax_ns)
pl300_run = _dax_ns["pl300_run"]
pl300_tables = _dax_ns["pl300_tables"]
del _engine_src, _glue_src
`);
      // Warm up: builds the sample model once.
      py.globals.get('pl300_tables')();
      status('Ready');
      return py;
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

self.onmessage = async (e) => {
  const { id, type, payload } = e.data || {};
  try {
    const py = await boot();
    let result = null;
    if (type === 'tables') {
      result = JSON.parse(py.globals.get('pl300_tables')());
    } else if (type === 'run') {
      result = JSON.parse(py.globals.get('pl300_run')(JSON.stringify(payload)));
    }
    self.postMessage({ id, ok: true, result });
  } catch (err) {
    self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  }
};
