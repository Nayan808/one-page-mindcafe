"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, DepthOfField, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction, ChromaticAberrationEffect } from "postprocessing";
import * as THREE from "three";

import { buildNeuralGeometry } from "./geometry";
import { tryLoadBrainPoints } from "./brainModel";
import { NEURAL_INK, NEURAL_MOTION, NEURAL_PALETTE } from "./palette";
import {
  LINK_FRAGMENT,
  LINK_VERTEX,
  NODE_FRAGMENT,
  NODE_VERTEX,
  PULSE_FRAGMENT,
  PULSE_VERTEX,
} from "./shaders";
import type { ScrollSignal } from "./useScrollSignal";

export type NeuralTheme = "ink" | "glow";

export type NeuralSceneProps = {
  density: number;
  pulseRate: number;
  baseColor: string;
  accentColor: string;
  intensity: number;
  signal: RefObject<ScrollSignal>;
  /** Reduced motion renders a single composed still: no dolly, no pulses,
   *  no drift — but the same lighting and grading, so it stays beautiful. */
  still: boolean;
  /** Low-power devices drop DepthOfField, the most expensive pass. */
  enableDof: boolean;
  /** Whether this band opens on the head-profile silhouette before
   *  dispersing. Hero-only by intent — repeating the signature in every
   *  band turns a motif into wallpaper, so secondary bands run as a pure
   *  ambient field. */
  signature: boolean;
  /** "ink" draws the network on the cream page (homepage default);
   *  "glow" is the original additive treatment for dark bands. */
  theme: NeuralTheme;
};

const CAMERA_START_Z = 7.2;
// Glow mode flies the camera THROUGH the web, which is dramatic on a dark
// void. Ink mode deliberately stops short: passing into the mesh magnifies
// the filaments until they crawl all over the body copy, so the ink dolly
// only closes part of the distance and keeps the drawing at a legible,
// wallpaper-like scale the whole way down the page.
const CAMERA_END_Z_GLOW = -2.4;
const CAMERA_END_Z_INK = 4.7;

export function NeuralScene({
  density,
  pulseRate,
  baseColor,
  accentColor,
  intensity,
  signal,
  still,
  enableDof,
  signature,
  theme,
}: NeuralSceneProps) {
  const { camera, invalidate } = useThree();
  const dpr = useThree((s) => s.viewport.dpr);

  // Optional real brain mesh. Null until (and unless) public/brain.glb
  // exists; the procedural brain renders meanwhile, so there is never a
  // frame with no field.
  const [modelPoints, setModelPoints] = useState<Float32Array | null>(null);
  useEffect(() => {
    let alive = true;
    void tryLoadBrainPoints(density).then((pts) => {
      if (alive && pts) setModelPoints(pts);
    });
    return () => {
      alive = false;
    };
  }, [density]);

  const geo = useMemo(() => buildNeuralGeometry(density, 0x5eed, modelPoints), [density, modelPoints]);

  const ink = theme === "ink";
  // Additive light on a dark ground; ordinary alpha compositing on cream.
  const blending = ink ? THREE.NormalBlending : THREE.AdditiveBlending;
  const linkColor = ink ? NEURAL_INK.filament : NEURAL_PALETTE.filament;
  const pulseColor = ink ? NEURAL_INK.pulse : NEURAL_PALETTE.pulse;
  // Ink filaments are the drawing, so they sit far more present than the
  // barely-there navy glow lines; ink nodes are small and quiet.
  // Raised hard from 0.12: at that weight the brain simply was not legible.
  // Deep blue pigment on cream can carry far more opacity than near-black
  // ink could without the page feeling scribbled on.
  // NOTE this is not a final alpha: the fragment multiplies it by aStrength
  // (0.35-1.0) and a depth fade, so an apparent 0.3 was landing near 0.18 on
  // screen and the brain read as a grey smudge. 0.7 here lands around 0.45.
  const linkOpacity = ink ? 0.7 : 0.9;
  // Glow nodes are far smaller than they were: Bloom inflates every node,
  // and at 1.9 the halos merged into one cloud that swallowed the brain
  // structure entirely. Small hot points + stronger lines keep the anatomy
  // legible through the bloom.
  const nodeSize = ink ? 1.85 : 1.0;
  const pulseSize = ink ? 0.5 : 0.55;

  // --- Nodes ---------------------------------------------------------
  const nodes = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // `position` is required by three's frustum/bounds machinery even
    // though the vertex shader ignores it in favour of aAmbient/aProfile.
    g.setAttribute("position", new THREE.BufferAttribute(geo.ambient, 3));
    g.setAttribute("aAmbient", new THREE.BufferAttribute(geo.ambient, 3));
    g.setAttribute("aProfile", new THREE.BufferAttribute(geo.profile, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(geo.size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(geo.seed, 1));
    g.setAttribute("aTint", new THREE.BufferAttribute(geo.tint, 1));
    // The shader relocates vertices far outside `position`'s extent, so
    // automatic culling would pop the whole cloud out of view. A generous
    // manual sphere keeps it drawn.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -4), 40);

    const m = new THREE.ShaderMaterial({
      vertexShader: NODE_VERTEX,
      fragmentShader: NODE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uTime: { value: 0 },
        uProfile: { value: 1 },
        uDrift: { value: 0.12 },
        uSize: { value: nodeSize },
        uPixelRatio: { value: dpr },
        uIntensity: { value: intensity },
        uInk: { value: ink ? 1 : 0 },
        uColorA: { value: new THREE.Color(baseColor) },
        uColorB: { value: new THREE.Color(accentColor) },
      },
    });
    return { g, m };
  }, [geo, baseColor, accentColor, intensity, dpr, ink, blending, nodeSize]);

  // --- Filaments -----------------------------------------------------
  const links = useMemo(() => {
    const n = geo.links.length; // one vertex per endpoint
    const ambient = new Float32Array(n * 3);
    const profile = new Float32Array(n * 3);
    const seed = new Float32Array(n);
    const strength = new Float32Array(n);

    for (let v = 0; v < n; v++) {
      const node = geo.links[v];
      const src = node * 3;
      const dst = v * 3;
      ambient[dst] = geo.ambient[src];
      ambient[dst + 1] = geo.ambient[src + 1];
      ambient[dst + 2] = geo.ambient[src + 2];
      profile[dst] = geo.profile[src];
      profile[dst + 1] = geo.profile[src + 1];
      profile[dst + 2] = geo.profile[src + 2];
      seed[v] = geo.seed[node];
      // Both endpoints of one filament share a strength (pair index >> 1)
      // so a line never fades unevenly along its own length.
      strength[v] = 0.35 + geo.tint[geo.links[(v >> 1) << 1]] * 0.65;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(ambient, 3));
    g.setAttribute("aAmbient", new THREE.BufferAttribute(ambient, 3));
    g.setAttribute("aProfile", new THREE.BufferAttribute(profile, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aStrength", new THREE.BufferAttribute(strength, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -4), 40);

    const m = new THREE.ShaderMaterial({
      vertexShader: LINK_VERTEX,
      fragmentShader: LINK_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uTime: { value: 0 },
        uProfile: { value: 1 },
        uDrift: { value: 0.12 },
        uColor: { value: new THREE.Color(linkColor) },
        uIntensity: { value: intensity },
        uInk: { value: ink ? 1 : 0 },
        uOpacity: { value: linkOpacity },
      },
    });
    return { g, m };
  }, [geo, intensity, ink, blending, linkColor, linkOpacity]);

  // --- Pulses --------------------------------------------------------
  const pulses = useMemo(() => {
    const linkCount = geo.links.length / 2;
    // Roughly one pulse per four filaments, capped — sparse by design.
    const count = Math.min(120, Math.max(24, Math.floor(linkCount * 0.25)));

    const fromA = new Float32Array(count * 3);
    const fromP = new Float32Array(count * 3);
    const toA = new Float32Array(count * 3);
    const toP = new Float32Array(count * 3);
    const seedFrom = new Float32Array(count);
    const seedTo = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const threshold = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Deterministic stride across the link list rather than random
      // picking, so pulses are spread over the whole web instead of
      // clumping on one region.
      const link = Math.floor((i * linkCount) / count);
      let a = geo.links[link * 2];
      let b = geo.links[link * 2 + 1];
      // Alternate direction so traffic isn't uniformly one-way.
      if (i % 2 === 1) [a, b] = [b, a];

      const i3 = i * 3;
      for (let k = 0; k < 3; k++) {
        fromA[i3 + k] = geo.ambient[a * 3 + k];
        fromP[i3 + k] = geo.profile[a * 3 + k];
        toA[i3 + k] = geo.ambient[b * 3 + k];
        toP[i3 + k] = geo.profile[b * 3 + k];
      }
      seedFrom[i] = geo.seed[a];
      seedTo[i] = geo.seed[b];
      phase[i] = geo.tint[a];
      speed[i] = 0.06 + geo.tint[b] * 0.1;
      // Even spread of thresholds so energy recruits pulses linearly.
      threshold[i] = i / count;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(fromA, 3));
    g.setAttribute("aFromAmbient", new THREE.BufferAttribute(fromA, 3));
    g.setAttribute("aFromProfile", new THREE.BufferAttribute(fromP, 3));
    g.setAttribute("aToAmbient", new THREE.BufferAttribute(toA, 3));
    g.setAttribute("aToProfile", new THREE.BufferAttribute(toP, 3));
    g.setAttribute("aSeedFrom", new THREE.BufferAttribute(seedFrom, 1));
    g.setAttribute("aSeedTo", new THREE.BufferAttribute(seedTo, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aThreshold", new THREE.BufferAttribute(threshold, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -4), 40);

    const m = new THREE.ShaderMaterial({
      vertexShader: PULSE_VERTEX,
      fragmentShader: PULSE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
      uniforms: {
        uTime: { value: 0 },
        uProfile: { value: 1 },
        uDrift: { value: 0.12 },
        uEnergy: { value: still ? 0 : NEURAL_MOTION.idleEnergy },
        uPulseRate: { value: pulseRate },
        uSize: { value: pulseSize },
        uPixelRatio: { value: dpr },
        uIntensity: { value: intensity },
        uInk: { value: ink ? 1 : 0 },
        uColor: { value: new THREE.Color(pulseColor) },
      },
    });
    return { g, m, count };
  }, [geo, pulseRate, intensity, dpr, still, ink, blending, pulseColor, pulseSize]);

  useEffect(() => {
    return () => {
      for (const { g, m } of [nodes, links, pulses]) {
        g.dispose();
        m.dispose();
      }
    };
  }, [nodes, links, pulses]);

  // Reduced motion: compose one deliberate frame — head silhouette fully
  // formed, camera parked at a flattering distance — then stop.
  const composed = useRef(false);
  useEffect(() => {
    if (!still) {
      composed.current = false;
      return;
    }
    camera.position.set(0, 0, CAMERA_START_Z - 1.1);
    camera.lookAt(0, 0, -3);
    for (const { m } of [nodes, links, pulses]) {
      m.uniforms.uProfile.value = signature ? 1 : 0;
      m.uniforms.uDrift.value = 0;
      m.uniforms.uTime.value = 2.4; // a fixed, pleasant twinkle phase
    }
    composed.current = true;
    invalidate();
  }, [still, signature, camera, nodes, links, pulses, invalidate]);

  useFrame((state, delta) => {
    if (still) return;

    const { progress, energy } = signal.current;
    const t = state.clock.elapsedTime;

    // Dolly forward through the web. Eased so entry and exit of the band
    // decelerate rather than running at constant speed.
    const eased = progress * progress * (3 - 2 * progress);
    const endZ = ink ? CAMERA_END_Z_INK : CAMERA_END_Z_GLOW;
    camera.position.z = CAMERA_START_Z + (endZ - CAMERA_START_Z) * eased;
    // A whisper of parallax drift; the near field slides more than the far
    // simply through perspective, this just adds lateral life.
    camera.position.x = Math.sin(t * 0.06) * 0.35;
    camera.position.y = Math.cos(t * 0.05) * 0.22;
    camera.lookAt(0, 0, -3);

    // Head silhouette holds through the first third of the band, then
    // dissolves into the ambient field.
    // Closed through the hero, then unfolding across roughly the next fifth
    // of the page. Tighter than the old 0.06->0.40 window: on a long
    // homepage that spread the opening so thinly it never read as an event.
    const profileAmount = signature ? 1 - Math.min(1, Math.max(0, (progress - 0.03) / 0.19)) : 0;

    for (const { m } of [nodes, links, pulses]) {
      m.uniforms.uTime.value = t;
      m.uniforms.uProfile.value = profileAmount;
    }
    pulses.m.uniforms.uEnergy.value = energy;

    // Guard against a frame-rate spike turning drift into a jolt.
    void delta;
  });

  // Built directly rather than via the <ChromaticAberration> wrapper: that
  // component's props type is Omit<Partial<Ctor[0]>, 'offset'> where Ctor[0]
  // is optional, so Partial<T | undefined> erases radialModulation and
  // modulationOffset from the surface. Those two are exactly what confines
  // the fringing to the frame edges, which is the only place the brief
  // wants it — so the effect is constructed here where they're typed.
  const chromatic = useMemo(
    () =>
      new ChromaticAberrationEffect({
        blendFunction: BlendFunction.NORMAL,
        offset: new THREE.Vector2(0.0006, 0.0009),
        radialModulation: true,
        modulationOffset: 0.62,
      }),
    [],
  );

  useEffect(() => () => chromatic.dispose(), [chromatic]);

  const meshes = (
    <>
      <points geometry={nodes.g} material={nodes.m} frustumCulled={false} />
      <lineSegments geometry={links.g} material={links.m} frustumCulled={false} />
      <points geometry={pulses.g} material={pulses.m} frustumCulled={false} />
    </>
  );

  // Ink mode ships NO post-processing at all, and that is the whole point.
  // Bloom, chromatic aberration and film grain are precisely what made this
  // read as a generic neon tech background; on cream they would also just
  // haze the page. Drawing the geometry straight keeps the lines crisp like
  // print, and skipping the composer removes five full-screen passes, so
  // ink mode is dramatically cheaper than glow as a side benefit.
  if (theme === "ink") return meshes;

  return (
    <>
      {meshes}

      <EffectComposer enableNormalPass={false} multisampling={0}>
        <Bloom
          intensity={2.7}
          luminanceThreshold={0.02}
          luminanceSmoothing={0.28}
          mipmapBlur
          radius={0.9}
        />
        {enableDof ? (
          <DepthOfField focusDistance={0.028} focalLength={0.15} bokehScale={1.3} height={480} />
        ) : (
          <></>
        )}
        <primitive object={chromatic} />
        <Vignette eskil={false} offset={0.28} darkness={0.82} />
        <Noise opacity={0.035} premultiply blendFunction={BlendFunction.OVERLAY} />
      </EffectComposer>
    </>
  );
}
