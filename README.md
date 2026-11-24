# token-launch-radar

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/kop223666/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/kop223666/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar: it ranks pre-token protocols by what their token would be worth if their record stayed as it is, and shows a reader how to farm each one. The multiple is the market's own — the median market-cap / TVL of the live-token protocols in the same category, read from the snapshot itself, never a hardcoded name.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` (Node 22, standard library only) reads the sealed snapshot, writes the ranked board to `out/board.json`, the dashboard data to `out/data.js`, and copies `dashboard/` and `screenshots/` to `out/`, then writes `out/dossier.json`. The board covers the whole watchlist plus the 200 pre-token protocols below the floor with the most TVL.

---

<sub>Entered on [make.fun](https://make.fun/?ref=q9ajfedj&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
