// LONGWAVE map data only, no three.js import. Plan view: X east, Z south, Y up, floor at y = 0.
// Vanguard (attackers) spawn south (z > 0), Wardens (defenders) spawn north (z < 0).
// Site A "Dish Array" north-west, Site B "Relay House" north-east, services down the middle.
// A box is { w, h, d, x, y, z, mat }: w along X, h up, d along Z, centred on x/z, base at y.
// `mat` only picks a look in world.js.

export const WALL_H = 5.5;
export function box(w, h, d, x, y, z, mat) { return { w, h, d, x, y, z, mat }; }

// Spawn courts and site centres, shared by map/world/rounds.
export const PLAY = {
  vanguard: { cx: 0, cz: 17.0, r: 4.5 }, // south yard
  warden: { cx: 0, cz: -17.0, r: 4.0 },   // north court
};

// The four outer walls. Floor runs x -30..30, z -22..22 (centres at +/-29.55, +/-21.55).
export const walls = [
  box(61.8, WALL_H, 0.9, 0, 0, -21.55, 'concrete'),
  box(61.8, WALL_H, 0.9, 0, 0, 21.55, 'concrete'),
  box(0.9, WALL_H, 43.1, -30.05, 0, 0, 'concrete'),
  box(0.9, WALL_H, 43.1, 30.05, 0, 0, 'concrete'),
];

// Everything solid. put(w, h, d, x, z, mat, y = 0) is the short form used below.
export const solids = [];
const put = (w, h, d, x, z, mat, y = 0) => { solids.push(box(w, h, d, x, y, z, mat)); };

// Site A: raised plinth (top y 0.6) with the dish mount, plus crate cover.
put(18, 0.6, 18, -13.5, -15.5, 'concrete'); // plinth
put(3.4, 0.9, 3.4, -17.0, -17.5, 'concrete', 0.6); // dish mount block
put(1, 1.7, 7, -23, -16, 'crate', 0.6);
put(8.0, 1.7, 1.0, -13.0, -25.6, 'crate', 0.6);
put(2.4, 1.6, 2.4, -9.0, -18.0, 'crate', 0.6);
put(2.4, 1.2, 2.4, -8.4, -20.6, 'crate', 1.2);
// Site B: Relay House, 8 x 7 m interior (x 15..23, z -18..-11), one 1.8 m door on the west wall.
put(1, 4.2, 2.5, 14.5, -20.75, 'concrete'); // west wall, north of the door
put(1, 4.2, 3.0, 14.5, -10.5, 'concrete'); // west wall, south of the door
put(1, 2.0, 1.8, 14.5, -13.0, 'concrete', 2.4); // door header
put(9, 4.2, 1, 18.5, -21.4, 'concrete'); // north wall
put(9, 4.2, 1, 18.5, -8.1, 'concrete'); // south wall
put(1, 4.2, 7, 23.5, -14.75, 'concrete'); // east wall
put(8.4, 0.6, 7.0, 18.5, -14.85, 'roof', 4.2); // roof slab
put(0.8, 1.0, 2.2, 19.4, -14.8, 'crate'); // relay rack inside (plant cover)

// Mid: raised service bunker, solid to its roof, splitting mid from the spawn court.
put(16, 4.2, 16, -3, -6, 'concrete');
put(6, 0.6, 6, -3, -6, 'roof', 4.2);

// Water tower (world.js draws the tank): legs and a crate at its base.
put(0.5, 6, 0.5, 7.5, 3.5, 'rust');
put(0.5, 6, 0.5, 10.0, 3.5, 'rust');
// South: Vanguard yard cargo containers and scattered crates.
put(6.0, 2.6, 2.4, -8.0, 14.2, 'container');
put(6.0, 2.6, 2.4, -21.0, 8.0, 'container');
put(2.4, 2.6, 6.0, 12.0, 9.0, 'container');
put(6.0, 2.6, 2.4, -2.0, 17.4, 'container');
put(2.4, 1.2, 2.4, -24.0, 10.6, 'crate');

// Ten spawn points in the two courts, facing the site they approach.
export const spawns = {
  vanguard: [[-3.0, 19.0], [0, 19.5], [3.0, 19.0], [-1.5, 16.5], [1.5, 16.5]],
  warden: [[-3.0, -16.0], [0, -16.5], [3.0, -16.0], [-1.0, -15.2], [1.0, -15.2]],
};

// Plant areas (see SOLIDS above). "spawn" is the default device drop point on the floor.
export const sites = {
  A: { cx: -13.5, cz: -15.5 },
  B: { cx: 19.0, cz: -14.5 },
};

// Waypoint edges for bots: three lanes join each spawn court to both sites.
//   A-long  west: Vanguard yard -> west road -> plinth -> Dish Array (Site A)
//   Mid     centre: both courts through mid field / north passage / plinth -> both sites
//   B-tunnel east: Vanguard yard -> east screen -> Relay House door -> Site B
// Nodes are map.js `box` records { x, y, z } (y = 0 on the desert floor, 0.6 on plinth and Site B floor).
export const waypoints = {
  h: [1.2, 2.4],
  nodes: [
    { id: 'vs',   x: 0,     z: 19.0, g: 1 },
    { id: 'vm',   x: 0,     z: 11.0 },
    { id: 've',   x: 12.0,  z: 1.5,  g: 1 },
    { id: 've2',  x: 11.0,  z: 5.4 },
    { id: 'vn',   x: 0,     z: -16.75 },
    { id: 'wn',   x: 9.0,   z: -13.0, g: 1 },
    { id: 'we',   x: -6.0,  z: -16.5 },
    { id: 'awn',  x: -2.3,  z: -15.6 },
    { id: 'aw',   x: -24.0, z: 12.0 },
    { id: 'aw2',  x: -27.0, z: 11.5 },
    { id: 'aw3',  x: -27.0, z: -6.5, g: 1 },
    { id: 'aw4',  x: -21.6, z: -9.8 },
    { id: 'h1',   x: -12.5, z: -1.9, h: 1.2 },
    { id: 'hAgent', x: -12.5, z: -4.5, h: 2.4 },
    { id: 'h3',   x: -12.5, z: -9.7 },
    { id: 'ht',   x: -12.5, z: -14.8, site: 'A' },
    { id: 'aa',   x: -18.0, z: -6.8,  site: 'A' },
    { id: 'as',   x: -14.2, z: -11.6, site: 'A' },
    { id: 'aap',  x: -18.0, z: -21.0, site: 'A' },
    { id: 'asp',  x: -14.2, z: -19.6, site: 'A' },
    { id: 'aep',  x: -11.0, z: -17.3, site: 'A' },
    { id: 'be2',  x: 13.0,  z: -9.6,  g: 1 },
    { id: 'door', x: 13.0,  z: -13.2 },
    { id: 'bt',   x: 16.6,  z: -16.5, site: 'B' },
    { id: 'bpt',  x: 19.3,  z: -13.7, site: 'B' },
  ],
  edges: [
    ['vs', 'vm'], ['vs', 'vs2'], ['vs', 'awn'], ['vm', 'vm2'], ['vm', 've'], ['vm', 'wn2'],
    ['vm', 'vn'], ['vs2', 'vm2'], ['vs2', 'vw'], ['vs2', 'bam'],
    ['vs2', 'vn'], ['bam', 'amm'], ['amm', 'bam2'], ['bam2', 've'], ['ve', 've2'], ['ve2', 'awn'],
    ['we', 'bse2'], ['awn', 'wn2'], ['wn2', 'wn'], ['wn', 'bse'], ['wn', 'awn'],
    ['aw', 'bam'], ['aw', 'aw2'], ['aw2', 'aw3'], ['aw3', 'awn'],
    ['aw4', 'aa'], ['aw4', 'as'], ['aa', 'as'], ['as', 'ae3'], ['as', 'ae4'],
    ['as', 'awg'], ['awg', 'bam'], ['awn', 'vs'],
    ['bse', 'door'], ['door', 'bt'], ['bt', 'bpt'],
  ],
};
