# PL-300 Studio

Study app for Microsoft's PL-300 (Power BI Data Analyst) exam: a study plan, exam-style questions, DAX and Power Query labs, case studies, drills and flashcards. It's a static React app served from GitHub Pages; progress lives in the browser and can sync between devices.

## Running it

```
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check and build into dist/
```

Every push to `main` builds and deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Sync across devices

Help → Link devices gives a 20-character sync code (Crockford base32, 100 random bits) to type on another device. There's no account and no email. The design is ported from databites' sync and uses **the same Supabase project**, with its own tables.

### One-time setup

1. Open the databites project in the Supabase dashboard → **SQL Editor** → **New query**.
2. Paste all of [`supabase/pl300_sync.sql`](supabase/pl300_sync.sql) and press **Run**. Running it again is safe.

Until that's done, turning sync on says "Sync isn't available yet" and nothing else changes. The project URL and publishable key are at the top of [`src/sync/engine.ts`](src/sync/engine.ts). The publishable key is public by design: it can only call the functions the SQL grants.

### How it works

- **Database.** `pl300_sync` holds one row per code: the progress (as JSON), a version number and a timestamp. `pl300_sync_history` keeps the last 15 versions each save replaced. Rows are keyed by the SHA-256 of the code, never the code itself. Row level security is on with no policies, so the app can only call five functions: `pl300_sync_load`, `pl300_sync_save`, `pl300_sync_versions`, `pl300_sync_load_version` and `pl300_sync_delete`. Saves are capped at 200 KB and the table at 2,000 codes.
- **Local first.** The app never waits on the network. Changes go out 4 seconds after they stop, and when the tab is hidden. It checks for changes when it opens, when the tab comes back, when the browser goes back online, and on page changes (at most once a minute).
- **Versions.** Every save names the version it was based on, and the server refuses it if another device saved in between. The device then loads the newer copy, merges (`src/sync/merge.ts`) and tries again. A device with no unsent changes just takes the newer copy, so unticking things carries over too.
- **Merging** keeps everything done on either side: ticked skills, watched videos and finished labs are combined. The most recent answer and flashcard rating win, as do the higher case study score and the longer note. Drill attempts from both sides are added to the count the devices last agreed on.
- **Rolling back** (Version history) loads an old version and saves it as the newest, so the copy it replaces stays in the history.
- **What's stored** in each row: `{ schema, app, device, progress }`. `schema` is `DATA_SCHEMA` from `src/version.ts`, so a future build can tell an older progress format apart.
- **The free tier** pauses a project after a week with no requests. Databites and PL-300 Studio share the project, so either app's use keeps it awake. If it does pause, restore it from the dashboard.

## Versions and releases

`src/version.ts` holds `APP_VERSION`, the release date and the `CHANGELOG`. For each release that changes something people use:

1. Raise `APP_VERSION` (major.minor.patch), and `"version"` in `package.json` to match.
   - **Patch:** fixes and polish.
   - **Minor:** something new to do.
   - **Major:** a change to how progress is stored or synced (and raise `DATA_SCHEMA` if its shape changes).
2. Add an entry at the top of `CHANGELOG`. Anyone who used an older release sees it once as the "What's new" note; Help → About lists them all.
3. If the release changes something a walkthrough describes, rewrite those steps in `src/data/tours.ts` and raise that tour's `rev`, so people who saw the old one see it again.

## Walkthroughs and the guide

- `src/data/tours.ts`: the spotlight steps for each page. Each step points at an element with a matching `data-tour` attribute, and steps whose element isn't on screen are skipped. A tour runs the first time its page opens; "Don't show tips" turns them all off. Help → Guide replays any of them.
- `src/components/help/GuidePanel.tsx`: the in-depth guide.
- `src/components/help/LinkDevicesPanel.tsx`: sync controls, version history, backup files and the device-linking guide.

## Layout

```
src/
  App.tsx                  routing (#/page/sub), layout, walkthrough + What's new
  version.ts               app version, changelog, data schema
  sync/                    engine.ts (sync), merge.ts, useSyncStatus.ts
  components/              one folder or file per page; help/ is the Help page
  data/                    questions, curriculum, cheat sheets, tours
  pqlab/                   the Power Query Lab engine
public/dax/                the databites DAX engine (Python, run with Pyodide)
supabase/pl300_sync.sql    the sync database
```
