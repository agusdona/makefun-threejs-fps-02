// LONGWAVE's one look plan: deep blue dusk, warm sodium amber, concrete grey, rust orange, cyan
// readouts. The same names are the CSS custom properties in index.html, so the 3D scene and the HUD
// never drift apart, and no other hue appears anywhere in the game.

export const PALETTE = {
  canvas: '#0d1320',   // dusk sky, the dark behind everything
  surface: '#1b2431',  // panels and shadowed concrete
  hairline: '#33404f', // edges, seams, distant structures
  ink: '#e8ddc8',      // sodium-lit light, the colour of the lamps
  muted: '#8d8f8c',    // worn concrete, dust
  accent: '#ffa63d',   // sodium amber: lamps, Vanguard, the crosshair
  rust: '#b5562c',     // rusted steel, containers, the Wardens' colour
  cyan: '#4fd6e0',     // CRT screens and signal lights
  sand: '#8a7254',     // open desert ground
  asphalt: '#2c3039',  // road and tunnel floors
};

// Lowercase hex (#rrggbb) -> [r, g, b] in 0..1, for anything that wants the channels rather than a CSS string.
export function rgb(name) {
  const value = Number.parseInt(PALETTE[name].slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

// The map builder passes tints as 0xrrggbb multipliers; this keeps them in the palette's family.
export function tint(name, k) {
  const [r, g, b] = rgb(name);
  const c = (v) => Math.round(Math.min(1, v * k) * 255);
  return (c(r) << 16) | (c(g) << 8) | c(b);
}
