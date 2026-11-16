// LONGWAVE — the entry program for make.fun's threejs-fps-02 bounty.
//
// The game is this repository's game/ folder: plain static files, ES modules, three.js 0.187.0
// vendored under game/vendor/three/ and reached through index.html's import map. There is no build
// step and no network request at play time: any static HTTP server serves game/ as it is.
//
// Running `node main.ts` hands the game in. It copies game/ and screenshots/ from beside this file to
// the output directory and writes dossier.json there, the summary the judge reads, with the kit's
// own makefun-threejs.ts. Inside the grader the output directory is /output; outside it,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The caps below are the scorer's: 160 KiB of dossier text, at most 4 screenshots at most 256 KiB
// each, and the whole game under 993 entries and 48 MiB. A game past them is refused here, at
// buildDossier, rather than after it has been uploaded.
//
// Node 22 standard library only: no dependencies, no package.json, no compile step.
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-threejs.ts';

// This repository, wherever `node main.ts` was called from.
const here = fileURLToPath(new URL('.', import.meta.url));

// The default /output may be a read-only mount outside the grader: only fall back when that
// directory was never set.
let outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
try {
  mkdirSync(outputDir, { recursive: true });
} catch (error) {
  if (process.env.MAKEFUN_OUTPUT_DIR !== undefined) throw error;
  outputDir = join(here, 'out');
  mkdirSync(outputDir, { recursive: true });
}

// game/ and screenshots/ go side by side, and the dossier is built from those copies, so it
// describes exactly the bytes handed in. A screenshots/ copy is made only when the folder exists;
// buildDossier itself refuses an entry with fewer than three.
cpSync(join(here, 'game'), join(outputDir, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`handed in ${join(here, 'game')} as ${outputDir} (dossier.json, ${dossier.length} bytes)`);
