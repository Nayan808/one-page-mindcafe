"use client";

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/** Where a real brain mesh is expected. Drop a .glb here and the field
 *  switches from the hand-traced stylised brain to real geometry with no
 *  code change. */
export const BRAIN_MODEL_URL = "/brain.glb";

/**
 * Tries to load a brain mesh and reduce it to a point cloud.
 *
 * Deliberately fail-soft: if the file is absent, malformed, or the fetch
 * 404s, this resolves to null and the caller keeps the procedural brain. A
 * missing optional asset must never blank out the homepage background.
 *
 * The mesh is centred and uniformly scaled to a known height, so the field's
 * camera framing does not depend on whatever units the source model happened
 * to be exported in — brain models in the wild vary from millimetres to
 * arbitrary blender units.
 */
export async function tryLoadBrainPoints(
  maxPoints: number,
  url = BRAIN_MODEL_URL,
): Promise<Float32Array | null> {
  try {
    // HEAD first so the common "no model provided" case costs one cheap
    // request rather than downloading and failing to parse something like
    // an HTML 404 page.
    const probe = await fetch(url, { method: "HEAD" });
    if (!probe.ok) return null;

    const buffer = await (await fetch(url)).arrayBuffer();
    const gltf = await new GLTFLoader().parseAsync(buffer, "");

    // Gather every mesh vertex in the scene.
    const chunks: Float32Array[] = [];
    let totalVerts = 0;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const attr = mesh.geometry?.getAttribute("position");
      if (!attr) return;
      // Bake world transforms so multi-part models (hemispheres, cerebellum
      // as separate nodes) assemble correctly instead of stacking at origin.
      const positions = new Float32Array(attr.count * 3);
      const v = new THREE.Vector3();
      for (let i = 0; i < attr.count; i++) {
        v.fromBufferAttribute(attr as THREE.BufferAttribute, i).applyMatrix4(mesh.matrixWorld);
        positions[i * 3] = v.x;
        positions[i * 3 + 1] = v.y;
        positions[i * 3 + 2] = v.z;
      }
      chunks.push(positions);
      totalVerts += attr.count;
    });

    if (totalVerts === 0) return null;

    // Decimate with a fixed stride rather than random picks, so the sampling
    // stays spatially even and identical on every load.
    const stride = Math.max(1, Math.floor(totalVerts / maxPoints));
    const kept: number[] = [];
    let index = 0;
    for (const chunk of chunks) {
      for (let i = 0; i < chunk.length / 3; i++, index++) {
        if (index % stride !== 0) continue;
        kept.push(chunk[i * 3], chunk[i * 3 + 1], chunk[i * 3 + 2]);
      }
    }

    const out = Float32Array.from(kept);

    // Centre on the origin and scale to a consistent height.
    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity,
      maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < out.length; i += 3) {
      minX = Math.min(minX, out[i]);
      maxX = Math.max(maxX, out[i]);
      minY = Math.min(minY, out[i + 1]);
      maxY = Math.max(maxY, out[i + 1]);
      minZ = Math.min(minZ, out[i + 2]);
      maxZ = Math.max(maxZ, out[i + 2]);
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const TARGET_SPAN = 5.6;
    const k = TARGET_SPAN / span;

    for (let i = 0; i < out.length; i += 3) {
      out[i] = (out[i] - cx) * k;
      out[i + 1] = (out[i + 1] - cy) * k;
      out[i + 2] = (out[i + 2] - cz) * k;
    }

    return out;
  } catch {
    return null;
  }
}
