// All per-frame motion — dispersal, breathing drift, pulse travel — is
// computed here on the GPU. The JS side only ever writes a handful of
// scalar uniforms per frame.

/**
 * Shared vertex preamble. Every one of the three materials resolves node
 * positions through the SAME `resolve()`, which is what keeps filaments
 * and pulses welded to their nodes: given identical ambient/profile/seed
 * inputs they compute a bit-identical result, so a filament endpoint can
 * never drift off the node it belongs to.
 */
const VERT_COMMON = /* glsl */ `
  uniform float uTime;
  uniform float uProfile;
  uniform float uDrift;

  // Low-frequency wander on three decorrelated axes. This is the "still
  // alive while idle" motion — deliberately slow (periods of ~30-50s) so
  // it registers as breathing rather than as animation.
  vec3 breathe(vec3 p, float seed) {
    float s = seed * 6.2831853;
    return vec3(
      sin(uTime * 0.18 + s + p.z * 0.15),
      cos(uTime * 0.15 + s * 1.3 + p.x * 0.12),
      sin(uTime * 0.12 + s * 0.7 + p.y * 0.10)
    ) * uDrift;
  }

  // uProfile 1.0 = hero head silhouette, 0.0 = dispersed ambient field.
  vec3 resolve(vec3 ambient, vec3 profile, float seed) {
    vec3 p = mix(ambient, profile, uProfile);
    return p + breathe(p, seed);
  }
`;

export const NODE_VERTEX = /* glsl */ `
  ${VERT_COMMON}

  attribute vec3 aAmbient;
  attribute vec3 aProfile;
  attribute float aSize;
  attribute float aSeed;
  attribute float aTint;

  uniform float uSize;
  uniform float uPixelRatio;

  varying float vTint;
  varying float vSeed;
  varying float vFade;

  void main() {
    vec3 p = resolve(aAmbient, aProfile, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = max(-mv.z, 0.001);
    gl_PointSize = aSize * uSize * uPixelRatio * (30.0 / dist);

    // Fade nodes the camera is about to pass through, and the far wall of
    // the field, so the dolly never terminates in a hard pop at either end.
    vFade = smoothstep(0.45, 2.4, dist) * (1.0 - smoothstep(15.0, 26.0, dist));
    vTint = aTint;
    vSeed = aSeed;
  }
`;

export const NODE_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;
  uniform float uTime;
  // 0 = glow (dark ground, additive), 1 = ink (cream ground, normal).
  uniform float uInk;

  varying float vTint;
  varying float vSeed;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;

    // Two-term falloff: a very tight core for the bright centre plus a
    // wide shallow halo. Bloom then blows the core out, which is what
    // produces the glowing-neuron look rather than a flat dot.
    float f = max(0.0, 1.0 - d);
    float core = pow(f, 9.0);
    float halo = pow(f, 2.0) * 0.22;
    float a = (core + halo) * vFade;

    // Slow per-node twinkle. Never dips far enough to read as flicker.
    float tw = 0.78 + 0.22 * sin(uTime * 0.55 + vSeed * 6.2831853);

    vec3 col = mix(uColorA, uColorB, vTint);

    // GLOW mode (dark ground, additive): the centre drives toward white so
    // Bloom has a hot core to latch onto.
    vec3 hot = mix(col, vec3(1.0), core * 0.8);
    vec3 rgbGlow = hot * a * tw * uIntensity * 3.4;

    // INK mode (cream ground, normal blending): no hot core and no bloom —
    // on a light background those read as cheap neon. This is a printed
    // dot instead: flat brand colour, a softer edge, and depth carried by
    // opacity rather than brightness.
    float aInk = pow(f, 2.6) * 0.92 * vFade * tw * uIntensity;

    gl_FragColor = vec4(mix(rgbGlow, col, uInk), mix(a, aInk, uInk));
  }
`;

export const LINK_VERTEX = /* glsl */ `
  ${VERT_COMMON}

  attribute vec3 aAmbient;
  attribute vec3 aProfile;
  attribute float aSeed;
  attribute float aStrength;

  varying float vStrength;
  varying float vFade;

  void main() {
    vec3 p = resolve(aAmbient, aProfile, aSeed);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = max(-mv.z, 0.001);
    vFade = smoothstep(0.5, 3.0, dist) * (1.0 - smoothstep(13.0, 24.0, dist));
    vStrength = aStrength;
  }
`;

export const LINK_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uOpacity;
  uniform float uInk;
  uniform float uProfile;

  varying float vStrength;
  varying float vFade;

  void main() {
    // Line weight is tied to how closed the brain is. The closed brain needs
    // real weight to read as anatomy, but carrying that same weight into the
    // opened field buries the page under crossing lines — the expanded state
    // covers the whole viewport, so it has to be far more delicate to stay
    // behind the copy rather than on top of it.
    float weight = mix(0.14, 1.0, uProfile);
    float a = vStrength * vFade * uOpacity * weight;
    // Additive on dark wants colour premultiplied by coverage; normal
    // blending on cream wants flat colour with the coverage in alpha.
    // These filaments are the drawing in ink mode, so they carry more
    // weight there than they do as glow.
    gl_FragColor = vec4(mix(uColor * a * uIntensity, uColor, uInk), a * mix(1.0, uIntensity, uInk));
  }
`;

export const PULSE_VERTEX = /* glsl */ `
  ${VERT_COMMON}

  attribute vec3 aFromAmbient;
  attribute vec3 aFromProfile;
  attribute vec3 aToAmbient;
  attribute vec3 aToProfile;
  attribute float aSeedFrom;
  attribute float aSeedTo;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aThreshold;

  uniform float uEnergy;
  uniform float uPulseRate;
  uniform float uSize;
  uniform float uPixelRatio;

  varying float vAlpha;

  void main() {
    vec3 a = resolve(aFromAmbient, aFromProfile, aSeedFrom);
    vec3 b = resolve(aToAmbient, aToProfile, aSeedTo);

    float t = fract(uTime * aSpeed * uPulseRate + aPhase);
    vec3 p = mix(a, b, t);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.001);

    // Each pulse holds a fixed random threshold; only those below the
    // current energy level fire. Raising uEnergy therefore recruits more
    // of the network smoothly, with no allocation and no popping — a
    // still user sees a sparse idle trickle, a fast scroller sees the web
    // light up.
    // NB: not named "active" — that is a reserved word in GLSL ES.
    float firing = step(aThreshold, uEnergy);
    // Fade in and out at the endpoints so pulses emerge from a node
    // rather than blinking into existence mid-filament.
    float env = sin(t * 3.14159265);
    float fade = smoothstep(0.4, 2.0, dist) * (1.0 - smoothstep(14.0, 25.0, dist));

    vAlpha = firing * env * fade;
    gl_PointSize = uSize * uPixelRatio * (30.0 / dist) * step(0.001, vAlpha);
  }
`;

export const PULSE_FRAGMENT = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uInk;

  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;

    float f = max(0.0, 1.0 - d);
    // Glow: a hot spark. Ink: a small solid travelling dot — which is what
    // reads as "a signal moving along a nerve" on a light ground, with no
    // luminance trickery available.
    float aGlow = (pow(f, 9.0) + pow(f, 2.2) * 0.22) * vAlpha;
    float aInk = pow(f, 2.0) * vAlpha;
    gl_FragColor = vec4(mix(uColor * aGlow * uIntensity, uColor, uInk), mix(aGlow, aInk, uInk));
  }
`;
