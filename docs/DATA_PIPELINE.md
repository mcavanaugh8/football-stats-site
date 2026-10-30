# MongoDB-backed React data pipeline

Season `2026` means the **2026–2027 NFL season**, including January/February 2027.
The client defaults to regular season; postseason is an explicit separate filter.

## Update data

In `pfr-web-scraper`:

```powershell
node scraper.js --year=2026
node gameLogsByYear.js --year=2026
node pushToDB.js --year=2026 --dry-run
node pushToDB.js --year=2026
```

The prior importer coverage gate still applies: review its report before using
`--allow-incomplete` for unresolved PFR player IDs. Team aggregates are built
from all bulk CSV stat rows, so they do not lose those players' contributions.
The publisher reads the cached stats and completed-game schedule, plus the
imported rosters. Download fresh source files before each weekly publish.

`pushToDB.js` now writes `teamStats` and `teamStatsByPosition` collections, each
containing 32 REG and 32 POST documents per import. They replace the local JS
snapshots as the source of matchup data. These are box-score opponent statistics,
not a claim to provide PFR advanced defensive charting.

It also writes `playerSeasonStats` and `rosterSnapshots`. All four snapshot
collections have season/import keys. Only after successful writes does it update
`datasetImports` to select the new complete import. Failed uploads may leave
unreferenced staging documents, but never activate them. Prior imports are retained;
periodic cleanup can be added later. Run one publisher per season at a time.

Legacy `players` and `rosters` are still updated for compatibility, but the React
site reads the versioned collections exclusively. Old player documents cannot leak
into the current season view. Current snapshot players contain only this season;
older published seasons are selected independently.

## Run the site

```powershell
npm install
npm run build
npm start
```

Use the site's own `.env`: `MONGODB_URL` (with `<db_password>`),
`MONGODB_PASSWORD` (raw, not encoded), and optionally
`MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8`. The old `MONGODB_USERNAME` configuration
is also supported if `MONGODB_URL` is absent. No credentials go into React.

For client development, run `npm run dev` and `npm run dev:client` in separate
terminals. Vite proxies `/api` to Express on port 3000.

## API and freshness

`GET /api/data?season=2026&seasonType=REG` returns metadata, supported metrics,
players, `teamStats`, and `teamStatsByPosition` from the same published import.
There is no process player cache. Each request reads the active pointer once and
pins all data queries to that import. Responses use `Cache-Control: no-store`.
The client refreshes every 30 seconds, on focus, or with the Refresh button.
Failed refreshes are displayed rather than silently presented as current data.

The React entry point replaces the old Handlebars route registration. Old
controllers, templates and static JS snapshots are retained as migration references
but are not imported by `app.js`, the API, or the React client.

## Correctness contract

- Canonical NFL team codes and `opp_name_abbr` identify game opponents.
- `pass_yds` is actual passing yardage; target air yards are not displayed as yards.
- Team-game denominators count distinct completed schedule games, never player rows.
- Season and season type come from source fields, not the current calendar date.
- Required basic metrics are validated. Unsupported charting metrics are excluded
  from API statistics and UI columns, never replaced with fabricated zeros.
- Rates use appropriate counts. Zero-game per-game metrics render as unavailable.
- Player hit rates use recorded statistical games, not an independently verified
  participation feed. Coverage omissions are visible in the client.

## Checks

Scraper: `node --test tests/nflverse.test.js tests/publishDataset.test.js`.
Site: `npm test` and `npm run build`.

## BETA bet builder

`/bet-builder` uses the same MongoDB import as the other views. The publisher also
writes `gameSchedules` (including upcoming games) and `opponentGameLogs` (individual
QB/RB/WR/TE performances, including players without PFR IDs). These collections
are staged before activating the import; the API validates their published counts.

Choose a week, game, player, category, direction and line. Player and opponent
rates update together. The opponent denominator is recorded same-position
**player-games**, not team totals or the percentage of games in which any player
cleared the line. Both sample counts and distinct opponent games are displayed.
Only games before the selected game's date and in the selected season phase count.
Missing values are excluded; empty samples display unavailable. Over/under equality
is a push excluded from settled samples; at-least includes equality.

Draft selections can be added, edited and removed. Drafts survive tab changes and
data refreshes within the app, but are not saved across browser reloads. No sportsbook
odds, bet placement or combined parlay probability is provided.

Player names now prefer the current nflverse roster name. Old embedded status
suffixes such as `(IR)` are removed during import/publish and defensively in the API.
Names are not a live injury-status or game-day availability feed.
