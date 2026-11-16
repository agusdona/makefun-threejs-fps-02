# LONGWAVE — three.js tactical FPS

[![make.fun · threejs-fps-02](https://make.fun/badge/threejs-fps-02.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![rank](https://make.fun/badge/threejs-fps-02/agusdona/makefun-threejs-fps-02/rank.svg)](https://make.fun/bounty/threejs-fps-02/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)
[![reward](https://make.fun/badge/threejs-fps-02/agusdona/makefun-threejs-fps-02/reward.svg)](https://make.fun/bounty/threejs-fps-02?utm_source=github&utm_medium=readme&utm_campaign=threejs-fps-02)

Entry for make.fun `threejs-fps-02`: make the best three.js tactical FPS.

A round-based tactical FPS in plain static files: three.js 0.187.0 vendored
under `game/vendor/three/`, no build step, no network at play time. Any static
HTTP server serves `game/` as it is.

## Run

```sh
node main.ts            # hands the game in (writes dossier.json to /output)
```

Outside the grader, `MAKEFUN_OUTPUT_DIR=out node main.ts` writes to `out/`.

To play locally, serve `game/` over HTTP (for example
`python3 -m http.server` inside `game/`) and open `index.html`.

## Play

WASD to move, mouse to aim, click to fire. Buy weapons between rounds,
plant/defuse the objective, and outplay the bot squad across the rounds.
Smoke and flash grenades, an in-game economy, and a round win/loss flow are
included.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` with the kit's
  `vendor/makefun-threejs.ts`.
- `game/` — the game itself (ES modules, `index.html` + `src/`).
- `screenshots/` — four gameplay screenshots (1280x720) used by the dossier.
- `vendor/` — the kit's dossier builder.
- `DESIGN.md`, `RESEARCH.md` — design and research notes.
