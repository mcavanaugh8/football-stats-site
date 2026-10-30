# Football Stats: data audit and React migration plan

Date: 2026-10-30. Branch: `codex/react-revamp` in `football-stats-site`.

Scope: current Express/Handlebars routes, their computations, static team files,
the nflverse adapter, local 2026 output, and the MongoDB upload code. No live
MongoDB reads/writes or deployment were performed. Findings establish what the
code uploads, not whether the last upload succeeded or what Atlas currently holds.

## What is uploaded?

| Data | Source and destination | Site consumption |
| --- | --- | --- |
| Players, game logs, grouped season logs, averages | `pfr-web-scraper/pushToDB.js` upserts the `Player` model (`players`) by PFR ID | `controllers/dbServices.js` reads all players |
| Rosters | Same uploader upserts the `Roster` model (`rosters`) by team | No current site roster query found |
| `teamStats.js` | Local source file exporting `defenseStats`; NOT uploaded | Imported at controller startup; used for defensive games-played denominators |
| `teamStatsByPosition.js` | Local generated JavaScript; NOT uploaded | Imported at controller startup, then overwritten by `/matchup-data` requests |
| Team defensive JSON | Optional legacy PFR scrape writes `data/defense`; NOT uploaded by current uploader | No direct link to the site's `teamStats.js` |
| Schedule | nflverse CSV cache used to attach dates/opponents to player games; NOT uploaded | No active schedule-file consumer found; site has an old 2024 TSV |
| Betting odds/lines | No odds feed uploaded | `/betting-lines` calculates fixed statistical threshold hit rates, not bookmaker odds |

The two team-stat JavaScript files do not need to be stored in MongoDB as files.
Their underlying season-specific aggregates need a reliable update path, either
computed server-side from current game records or materialized as database documents.

## Findings, in priority order

### P1: Opponent field and team-code mismatch breaks matchups

`controllers/controllers.js:177` and `:428` call `game.opp.toLowerCase()`.
The current adapter emits `opp_name_abbr` and `team_name_abbr`, not `opp`/`team`.
In the local 2026 QB/RB/WR/TE data, all 2,453 game rows have `opp_name_abbr` and
none have `opp`. Running the actual aggregation function in an isolated VM
produced 16,960 caught TypeErrors and zero aggregated game counts.

Simply adding an `opp` alias is insufficient: the site mixes `ari/ind/ten/lvr/bal/lar/lac`
with `gnb/kan/nor/nwe/sfo/tam`; adapter game rows use PFR codes such as CRD/CLT/OTI/RAI/RAV/RAM/SDG.
Normalize every team/opponent to a single NFL code at the API boundary.

### P1: The site selects the wrong season

`controllers/controllers.js:13` fixes the season to `2025`. Player totals and
hit-rate tables therefore ignore refreshed 2026 logs (or show old 2025 history).
`updateDefensiveData` separately uses the calendar year at `:149`, so even its
chosen season disagrees with the rest of the page. Calendar-year selection also
misclassifies January/February football. Pass an explicit season through every query
and calculation; use the dataset's season, not a September date heuristic.

### P1: Matchup data is stale even after writing its file

`controllers/controllers.js:10-11` imports both team files once. At `:96` a request
writes a new `teamStatsByPosition.js`, but `createMatchupData` continues reading
the object imported at process startup. Node does not automatically reload that
module. The first generation can overwrite a valid file with empty aggregates
because of the opponent error. Remove request-time source-file writes; use the
newly calculated result directly or a season-keyed database result.

`teamStats.js` has no season/provenance/update metadata, and its game counts are
only 5, 6 or 7 in the checked snapshot. These static denominators are combined
with independently generated totals. `teamStatsByPosition.g` is itself a count
of player-game contributions (`:178`), not unique team games. Use schedule/game
IDs to count actual completed team games.

### P1: Passing yards are confused with target air yards

Player totals (`:764`, `:778`, `:791`) and matchup tables (`:266`, `:386`) display
`pass_target_yds` under passing-yard labels. nflverse's mapped `pass_target_yds`
includes air yards on incomplete attempts; actual passing yards are `pass_yds`.
The hit-rate page already uses `pass_yds` (`:503`), so the pages disagree.
The checked static position snapshot contains `pass_yds`, not `pass_target_yds`.
Use `pass_yds` consistently for passing totals and label air-yard metrics separately.

### P2: Data refreshes and position filters are lost in the process cache

`controllers/dbServices.js:3-27` caches the initial `Player.find({})` forever.
On subsequent calls it returns the unfiltered cache, ignoring requested positions.
Successful weekly uploads are invisible until restart. Add cache expiry or an
import-version key and always filter the returned data. Prefer explicit season
queries over loading every historical player document.

### P2: Several requested metrics are absent or semantically incompatible

For the checked 2,453 game rows:

| Consumer field | Coverage / meaning | Required action |
| --- | --- | --- |
| `pass_yds`, `pass_cmp`, `pass_att`, `pass_td`, `rush_att`, `rush_yds`, `rush_td`, `targets`, `rec`, `rec_yds`, `rec_td` | Basic mapped statistics available | Use the correct fields in all views |
| `rush_fd` | Absent; adapter has `rush_first_down` | Standardize the name |
| `rush_yds_per_att` | Absent | Derive from yards / attempts; return unavailable for zero attempts |
| `rush_yds_before_contact` | Absent from current nflverse source | Show unavailable; do not fabricate zero |
| PFR drops, pressure, broken/missed tackles and similar charting | Unavailable from selected datasets | Hide or label unavailable, or add a verified source |
| `averages.avg_*` | Uploaded, but based on available player-stat rows | Document denominator; distinguish appearances from recorded stat rows |

`updateDefensiveData` currently converts missing values to zero and sums rate
fields such as `rec_adot` and `rec_yac_per_rec`. Rates must be recomputed from
aggregate numerators/denominators, not summed. `calculateTeamDeviation` also
rejects valid zero averages with a truthiness check (`:440`).

### P2: Import coverage and season identity need to be explicit

The current adapter report identifies unresolved PFR IDs; the prior dry run
reported 210 omitted roster entries, including Basil Okoye with statistics.
Permitting an incomplete import produces incomplete roster/aggregate coverage.
`pushToDB.js` only upserts by player ID/team, does not delete stale documents,
and does not partition documents by season. Players absent from this import
can retain old team/position/averages in MongoDB. The site reads all of them.
Add an import record, season, coverage counts and update timestamps; filter by
the selected season/import rather than interpreting every document as current.

### P2: The site has not received the connection fixes

`app.js:13` still interpolates the raw password into a hard-coded URI and does
not apply the scraper's DNS override. Port the tested connection configuration
to the backend; keep all database credentials server-side.

### P3: Schema and dormant UI paths need cleanup

`models/Player.js` declares `stats: Array`, but the uploader supplies a player
object and additional top-level log/average fields. Current reads use `lean()`,
so this is schema drift rather than proof of current read failure. Define the
actual data contract before introducing typed API responses.

Home-page player loading is commented out (`controllers/controllers.js:58-64`),
while `views/home.hbs` expects players and hard-codes 2024 PFR headshots. The
nflverse importer does not currently pass through its available headshot URL.
Unused legacy table helpers also expect array-shaped season statistics; do not
carry those assumptions into React.

## React migration sequence

1. Keep Express as the server and add a React client, with JSON endpoints instead
   of HTML strings generated in controllers. Preserve `/players`, `/matchup-data`,
   and `/betting-lines` as client routes. MongoDB stays behind the server.
2. First define/test a shared contract: PFR player ID, canonical NFL team code,
   season, season type, game ID, date, raw statistics, nullable unsupported values,
   source, and import timestamp. Carry game ID and season type out of the nflverse
   adapter (currently discarded from final rows), and include headshots if used.
3. Fix season selection, opponent normalization, passing-yard semantics and
   game-count denominators before reproducing tables. Test known player/game and
   team/week results against the downloaded source CSVs.
4. Replace local team JS snapshots with deterministic season aggregates. Suggested
   endpoints: `/api/seasons`, `/api/players?season=2026`,
   `/api/matchups?season=2026&position=WR`, `/api/hit-rates?season=2026&stat=pass_yds`.
   If materialized, use a unique season/team/position key and publish only after
   validating a complete import. Distinguish box-score defense from PFR charting.
5. Build React tables, season/position/team filters, loading/error/empty states,
   and visible source/coverage indicators. Keep missing values distinct from zero.
6. Verify all four pages against the same import, refresh behavior after upload,
   and regular-season versus postseason handling before deployment.

## Verification performed

- Read all current routes, their active rendering functions, data service, player
  schema, uploader, nflverse mapping, and team snapshots.
- Measured field coverage on local 2026 outputs: 889 offensive roster entries,
  2,453 game rows. These are local observations, not a database inventory.
- Executed the real defensive aggregation in a VM with output/errors captured,
  without invoking the route that writes `teamStatsByPosition.js`.
- Created the React branch without resetting or staging existing changes.
  The site tracks `node_modules` and already has many dependency changes; leave
  these out of application commits and address repository hygiene separately.

The React implementation and corrective application changes are not included
in this audit/branch-preparation step.
