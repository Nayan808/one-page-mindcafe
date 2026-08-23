// GLOW palette — the dark hero band, where the brain is additive light
// against a near-black void, matching the reference brain imagery.
//
//   brain blue     #8ad3f5  -> node cores; bright by necessity, because
//                              additive blending plus Bloom needs real
//                              luminance to produce glow at all
//   --brand-purple #a66c98  -> node cores, second tint; the brand thread
//                              running through the blue
//   --cream        #f6f1e6  -> travelling signals, so the moving element is
//                              the site's own paper white
//   lifted navy    #3f86b8  -> filaments. Deliberately NOT --brand-navy
//                              #2d4160: at that darkness additive blending
//                              emitted almost no light and the brain never
//                              read as a shape at all.
//
// The background is --brand-navy crushed almost to black — near-black with
// a hint of indigo, never pure #000, keeping the brand hue family intact
// rather than picking an arbitrary dark blue.
export const NEURAL_PALETTE = {
  /** Band background. --brand-navy taken down to ~4% luminance. */
  background: "#080a12",
  /** Node core tint A — the reference brain blue, bright enough that
   *  additive blending and Bloom turn it into actual light. */
  nodeA: "#8ad3f5",
  /** Node core tint B — --brand-purple. */
  nodeB: "#a66c98",
  /** Travelling signal pulses — --cream. */
  pulse: "#f6f1e6",
  /** Connecting filaments. NOT --brand-navy: at that darkness additive
   *  blending produced almost no light and the brain never read. This is a
   *  brand-navy hue pushed up in lightness so the filaments actually glow. */
  filament: "#3f86b8",
} as const;

// INK palette — the cream page below the hero, where the same geometry is
// drawn as pigment rather than light.
//
// Colour strategy reconciles two references: the glowing
// blue neuron imagery, and this site's mauve/navy identity.
//
// The reference blue is an electric cyan that only works because it sits on
// black — additively lit against a void. Placed literally on cream it goes
// pale, chalky and cheap, because there is no darkness for it to glow out
// of. So the blue is kept but taken DOWN: same hue family, far lower
// lightness, so it behaves like pigment on paper instead of light in a void.
//
// The brand is then woven in rather than sitting beside it — nodes alternate
// between the deep blue and --brand-mauve (uColorA/uColorB are mixed per
// node by aTint), and the travelling signals are pure mauve. The result
// reads as one considered duotone, which is what stops "brand colour plus
// an unrelated blue" from looking like two palettes fighting.
export const NEURAL_INK = {
  /** Filaments — the reference blue, deepened until it reads as ink on
   *  cream. Sits deliberately close to --brand-navy #2d4160 so the two
   *  never clash. */
  filament: "#235a86",
  /** Node tint A — the brain blue, a step brighter than the filaments so
   *  nodes read as junctions rather than dissolving into the lines. */
  nodeA: "#2f7fb5",
  /** Node tint B — --brand-mauve. This is the brand thread running
   *  through the anatomy. */
  nodeB: "#986178",
  /** Travelling signals — --brand-mauve at full strength, so the thing
   *  that MOVES is unmistakably brand-coloured. */
  pulse: "#986178",
} as const;

// Matches the site's existing motion vocabulary rather than inventing a
// new one: .reveal in globals.css is 0.6s ease-out, and every motion@12
// transition in the codebase sits between 0.4s and 0.7s with easeOut.
// The field's damping constants are tuned to that same unhurried feel —
// this is a mental-health brand, so nothing snaps.
export const NEURAL_MOTION = {
  /** Lerp factor for scroll progress. Lower = slower, calmer follow. */
  progressDamping: 0.055,
  /** Lerp factor for scroll-velocity energy decay back to idle. */
  energyDamping: 0.04,
  /** Baseline share of pulses firing when the user is completely still. */
  idleEnergy: 0.16,
  /** Ceiling on scroll-driven energy so fast flicks never look frantic. */
  maxEnergy: 0.72,
} as const;
