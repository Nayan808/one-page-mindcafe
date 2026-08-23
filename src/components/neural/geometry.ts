// Field construction. All of this runs ONCE at mount and produces static
// typed arrays — the per-frame work (drift, opening, pulse travel) lives
// entirely in the shaders, so there is no per-node JavaScript loop on the
// animation path.

/** Deterministic PRNG (mulberry32). Seeded so the composition is identical
 *  on every load and between server/client — a field that reshuffles on
 *  each refresh reads as noise, not as a designed image. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = readonly [number, number];

// An anatomical brain in left-facing sagittal view (frontal lobe at -x,
// occipital at +x, cerebellum and stem lower-right), normalised to roughly
// x -0.46..0.45, y -0.38..0.40. Traced clockwise from the top of the
// frontal lobe.
//
// NOTE ON APPROACH: this is a hand-traced 2D silhouette sampled as points,
// not a real 3D brain mesh. It is a stylised approximation and cannot match
// a photorealistic 3D brain render — see the fold arcs below, which are what
// carry most of the readability. A genuinely accurate brain needs an actual
// model or reference bitmap to sample from.
const BRAIN_OUTLINE: readonly Pt[] = [
  [-0.1, 0.4],
  [0.06, 0.39],
  [0.2, 0.35],
  [0.32, 0.28],
  [0.41, 0.17],
  [0.45, 0.04],
  [0.43, -0.06],
  [0.36, -0.13],
  [0.38, -0.21],
  [0.32, -0.27],
  [0.22, -0.29],
  [0.16, -0.36],
  [0.08, -0.38],
  [0.06, -0.3],
  [0.0, -0.24],
  [-0.1, -0.22],
  [-0.2, -0.25],
  [-0.3, -0.22],
  [-0.38, -0.14],
  [-0.44, -0.02],
  [-0.46, 0.12],
  [-0.4, 0.26],
  [-0.28, 0.35],
];

// Major sulci and gyri as open polylines — the central sulcus dropping from
// the crown, the lateral fissure that separates the temporal lobe, and the
// frontal, parietal, occipital and temporal folds. These carry the
// readability: a bare outline samples into an anonymous oval.
const BRAIN_FOLDS: readonly (readonly Pt[])[] = [
  // central sulcus
  [
    [-0.02, 0.36],
    [0.03, 0.24],
    [0.0, 0.12],
    [0.05, 0.01],
  ],
  // lateral (Sylvian) fissure — the deepest, most recognisable line
  [
    [-0.35, -0.02],
    [-0.23, -0.07],
    [-0.1, -0.07],
    [0.03, -0.03],
    [0.15, 0.02],
  ],
  // superior frontal gyrus
  [
    [-0.41, 0.15],
    [-0.29, 0.21],
    [-0.17, 0.21],
    [-0.07, 0.16],
  ],
  // parietal, sweeping toward the occipital
  [
    [0.1, 0.31],
    [0.2, 0.24],
    [0.29, 0.15],
    [0.35, 0.05],
  ],
  // temporal gyrus
  [
    [-0.29, -0.15],
    [-0.17, -0.17],
    [-0.04, -0.15],
  ],
  // occipital fold
  [
    [0.28, -0.02],
    [0.37, -0.07],
  ],
  // inner frontal fold, adds density to the front lobe
  [
    [-0.36, 0.04],
    [-0.25, 0.08],
    [-0.14, 0.06],
  ],
];

/** Standard even-odd ray cast against the outline. */
function insideBrain(x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = BRAIN_OUTLINE.length - 1; i < BRAIN_OUTLINE.length; j = i++) {
    const [xi, yi] = BRAIN_OUTLINE[i];
    const [xj, yj] = BRAIN_OUTLINE[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Arc-length table for a polyline, so sampling along it is uniform rather
 *  than bunching wherever the source points happen to sit close together. */
function measure(points: readonly Pt[], closed: boolean) {
  const lengths: number[] = [];
  let total = 0;
  const last = closed ? points.length : points.length - 1;
  for (let i = 0; i < last; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    const len = Math.hypot(bx - ax, by - ay);
    lengths.push(len);
    total += len;
  }
  return { lengths, total };
}

function pointAt(points: readonly Pt[], lengths: number[], total: number, t: number): Pt {
  let target = t * total;
  for (let i = 0; i < lengths.length; i++) {
    if (target <= lengths[i]) {
      const [ax, ay] = points[i];
      const [bx, by] = points[(i + 1) % points.length];
      const f = lengths[i] === 0 ? 0 : target / lengths[i];
      return [ax + (bx - ax) * f, ay + (by - ay) * f];
    }
    target -= lengths[i];
  }
  return points[points.length - 1];
}

export type NeuralGeometry = {
  count: number;
  /** Closed arrangement — nodes formed into the brain. */
  profile: Float32Array;
  /** Opened arrangement — the same nodes expanded outward into a field. */
  ambient: Float32Array;
  size: Float32Array;
  seed: Float32Array;
  tint: Float32Array;
  /** Flattened index pairs, two node indices per connection. */
  links: Uint16Array;
};

const BRAIN_SCALE = 4.9;
const BRAIN_DEPTH = 1.15;

/**
 * Builds the field from real mesh vertices.
 *
 * The link radius is derived from the model rather than hard-coded, because
 * vertex density varies enormously between brain models — a fixed radius
 * that looks like tissue on a 20k-vertex mesh produces either a solid blob
 * or nothing at all on a 200k one. Sampling actual nearest-neighbour
 * distances and working from their median makes the result self-tuning.
 */
function buildFromModel(points: Float32Array, seedValue: number): NeuralGeometry {
  const rand = mulberry32(seedValue);
  const count = Math.floor(points.length / 3);

  const profile = Float32Array.from(points);
  const ambient = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tint = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    ambient[i3] = profile[i3] * OPEN_SCALE + (rand() - 0.5) * 0.7;
    ambient[i3 + 1] = profile[i3 + 1] * OPEN_SCALE * 0.88 + (rand() - 0.5) * 0.6;
    ambient[i3 + 2] = profile[i3 + 2] * 1.6 - rand() * 7.0 + 1.2;
    const r = rand();
    size[i] = 0.3 + r * r * 1.8;
    seed[i] = rand();
    tint[i] = rand();
  }

  // Median nearest-neighbour distance over a small random sample.
  const probes = Math.min(64, count);
  const dists: number[] = [];
  for (let p = 0; p < probes; p++) {
    const i = Math.floor(rand() * count);
    const i3 = i * 3;
    let best = Infinity;
    for (let j = 0; j < count; j += Math.max(1, Math.floor(count / 400))) {
      if (j === i) continue;
      const j3 = j * 3;
      const dx = profile[i3] - profile[j3];
      const dy = profile[i3 + 1] - profile[j3 + 1];
      const dz = profile[i3 + 2] - profile[j3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < best) best = d;
    }
    if (best < Infinity) dists.push(Math.sqrt(best));
  }
  dists.sort((a, b) => a - b);
  const median = dists[Math.floor(dists.length / 2)] || 0.2;
  const radiusSq = Math.pow(median * 2.4, 2);

  const MAX_PER_NODE = 3;
  const pairs: number[] = [];
  const degree = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    if (degree[i] >= MAX_PER_NODE) continue;
    const i3 = i * 3;
    for (let j = i + 1; j < count && degree[i] < MAX_PER_NODE; j++) {
      if (degree[j] >= MAX_PER_NODE) continue;
      const j3 = j * 3;
      const dx = profile[i3] - profile[j3];
      const dy = profile[i3 + 1] - profile[j3 + 1];
      const dz = profile[i3 + 2] - profile[j3 + 2];
      if (dx * dx + dy * dy + dz * dz < radiusSq) {
        pairs.push(i, j);
        degree[i]++;
        degree[j]++;
      }
    }
  }

  return { count, profile, ambient, size, seed, tint, links: Uint16Array.from(pairs) };
}

// Uniform expansion factor for the "opening". Kept modest deliberately: at
// 1.75 every filament stretched far enough to sprawl across the whole
// viewport, and the fully-opened state read as a dirty tangle over the
// press logos and footer.
const OPEN_SCALE = 1.3;

// Sampling budget. Folds take the largest share because they carry the
// readability; the interior stays sparse so the folds remain visible
// through it instead of drowning in fill.
const OUTLINE_SHARE = 0.32;
const FOLD_SHARE = 0.42;

/**
 * @param modelPoints Optional real brain geometry (centred, pre-scaled) from
 *   brainModel.ts. When present it REPLACES the hand-traced silhouette
 *   entirely — real vertices give real anatomy, which no amount of tuning
 *   hand-typed polygon coordinates can reach. Absent, the stylised brain
 *   below is used, so the page always renders something.
 */
export function buildNeuralGeometry(
  count: number,
  seedValue = 0x5eed,
  modelPoints?: Float32Array | null,
): NeuralGeometry {
  if (modelPoints && modelPoints.length >= 9) {
    return buildFromModel(modelPoints, seedValue);
  }

  const rand = mulberry32(seedValue);

  const profile = new Float32Array(count * 3);
  const ambient = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const tint = new Float32Array(count);

  const outline = measure(BRAIN_OUTLINE, true);
  const folds = BRAIN_FOLDS.map((f) => ({ pts: f, ...measure(f, false) }));
  const foldTotal = folds.reduce((s, f) => s + f.total, 0);

  for (let i = 0; i < count; i++) {
    let px = 0;
    let py = 0;
    const pick = rand();

    if (pick < OUTLINE_SHARE) {
      const [ox, oy] = pointAt(BRAIN_OUTLINE, outline.lengths, outline.total, rand());
      px = ox + (rand() - 0.5) * 0.035;
      py = oy + (rand() - 0.5) * 0.035;
    } else if (pick < OUTLINE_SHARE + FOLD_SHARE) {
      // Pick a fold weighted by its own length, so long fissures receive
      // proportionally more nodes than short ones.
      let target = rand() * foldTotal;
      let chosen = folds[0];
      for (const f of folds) {
        if (target <= f.total) {
          chosen = f;
          break;
        }
        target -= f.total;
      }
      const [fx, fy] = pointAt(chosen.pts, chosen.lengths, chosen.total, rand());
      // Tighter jitter than the outline — a fold has to stay a legible line.
      px = fx + (rand() - 0.5) * 0.028;
      py = fy + (rand() - 0.5) * 0.028;
    } else {
      let attempts = 0;
      do {
        px = rand() - 0.5;
        py = rand() * 0.8 - 0.4;
        attempts++;
      } while (!insideBrain(px, py) && attempts < 64);
    }

    const pz = (rand() - 0.5) * BRAIN_DEPTH;
    const i3 = i * 3;

    profile[i3] = px * BRAIN_SCALE;
    profile[i3 + 1] = py * BRAIN_SCALE;
    profile[i3 + 2] = pz;

    // The "opening": a near-UNIFORM expansion of the whole structure, not a
    // scatter. An earlier version pushed each node outward by its own random
    // amount, which meant two linked neighbours travelled different
    // distances in different directions — every filament stretched into a
    // long arbitrary span and the opened state collapsed into visual noise.
    // Scaling by one shared factor stretches each link proportionally, so
    // the brain blooms outward while staying recognisably itself.
    ambient[i3] = profile[i3] * OPEN_SCALE + (rand() - 0.5) * 0.7;
    ambient[i3 + 1] = profile[i3 + 1] * OPEN_SCALE * 0.88 + (rand() - 0.5) * 0.6;
    ambient[i3 + 2] = pz * 2.0 - rand() * 7.0 + 1.2;

    const r = rand();
    size[i] = 0.4 + r * r * 2.0;
    seed[i] = rand();
    tint[i] = rand();
  }

  // Connection graph, computed against the closed brain arrangement. O(n^2)
  // at n<=520 is a one-time cost at mount and never runs again. The radius
  // is deliberately short: long spans read as a generic wireframe, whereas
  // short links between fold neighbours read as tissue.
  const MAX_PER_NODE = 4;
  const RADIUS_SQ = 0.95 * 0.95;
  const pairs: number[] = [];
  const degree = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    if (degree[i] >= MAX_PER_NODE) continue;
    const i3 = i * 3;
    // Collect candidates then take the nearest few, so a node links to its
    // true neighbours rather than whichever happened to be scanned first.
    const near: { j: number; d: number }[] = [];
    for (let j = i + 1; j < count; j++) {
      if (degree[j] >= MAX_PER_NODE) continue;
      const j3 = j * 3;
      const dx = profile[i3] - profile[j3];
      const dy = profile[i3 + 1] - profile[j3 + 1];
      const dz = profile[i3 + 2] - profile[j3 + 2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < RADIUS_SQ) near.push({ j, d });
    }
    near.sort((a, b) => a.d - b.d);
    for (const { j } of near) {
      if (degree[i] >= MAX_PER_NODE) break;
      if (degree[j] >= MAX_PER_NODE) continue;
      pairs.push(i, j);
      degree[i]++;
      degree[j]++;
    }
  }

  return { count, profile, ambient, size, seed, tint, links: Uint16Array.from(pairs) };
}
