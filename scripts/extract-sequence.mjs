// Extracts an evenly-spaced .webp frame sequence from a source video for
// scroll-scrubbed playback, and writes a manifest the client reads at
// runtime so frame count and dimensions are never hard-coded in two places.
//
// Run with:  npm run sequence -- <input.mp4> [outDirName] [frameCount] [width]
//
// ffmpeg/ffprobe come from ffmpeg-static / ffprobe-static (devDependencies),
// so this works without a system ffmpeg install.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(here, "..");

const ffmpeg = resolve(projectRoot, "node_modules/ffmpeg-static/ffmpeg.exe");
const ffprobe = resolve(
  projectRoot,
  "node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe",
);

const [, , inputArg, outNameArg = "neural-hero", frameCountArg = "96", widthArg = "1152"] =
  process.argv;

if (!inputArg) {
  console.error("usage: npm run sequence -- <input.mp4> [outDirName] [frameCount] [width]");
  process.exit(1);
}

const input = resolve(process.cwd(), inputArg);
if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

const frameCount = Number(frameCountArg);
const targetWidth = Number(widthArg);
const outDir = join(projectRoot, "public", "sequence", outNameArg);

// --- Probe -----------------------------------------------------------
function probe(entries) {
  return execFileSync(
    ffprobe,
    ["-v", "error", "-show_entries", entries, "-of", "default=noprint_wrappers=1:nokey=1", input],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n");
}

const [srcWidth, srcHeight] = probe("stream=width,height").map(Number);
const duration = Number(probe("format=duration")[0]);

if (!duration || !srcWidth) {
  console.error("Could not read duration/dimensions from input.");
  process.exit(1);
}

// Even spacing across the whole clip: sampling at (frames / duration) fps
// lands one frame per equal slice of time, which is what keeps scrub speed
// linear against scroll.
const fps = frameCount / duration;
const height = Math.round((targetWidth / srcWidth) * srcHeight);

console.log(
  `source ${srcWidth}x${srcHeight}, ${duration.toFixed(2)}s -> ${frameCount} frames @ ${targetWidth}x${height} (${fps.toFixed(3)} fps)`,
);

// --- Extract ---------------------------------------------------------
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

execFileSync(
  ffmpeg,
  [
    "-v", "error",
    "-i", input,
    // scale to an even height (-2) so the encoder never rejects odd dims
    "-vf", `fps=${fps},scale=${targetWidth}:-2`,
    "-frames:v", String(frameCount),
    "-c:v", "libwebp",
    "-quality", "78",
    "-compression_level", "6",
    "-an",
    join(outDir, "frame-%04d.webp"),
  ],
  { stdio: "inherit" },
);

// --- Manifest --------------------------------------------------------
const files = readdirSync(outDir).filter((f) => f.endsWith(".webp")).sort();
const bytes = files.reduce((sum, f) => sum + statSync(join(outDir, f)).size, 0);

writeFileSync(
  join(outDir, "manifest.json"),
  JSON.stringify(
    {
      frameCount: files.length,
      width: targetWidth,
      height,
      // Consumed by the client to build frame URLs; keeping the pattern here
      // means changing the naming scheme never needs a component edit.
      pattern: "frame-%04d.webp",
      sourceDuration: duration,
      totalBytes: bytes,
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `wrote ${files.length} frames, ${(bytes / 1024 / 1024).toFixed(2)} MB total ` +
    `(avg ${(bytes / files.length / 1024).toFixed(0)} KB/frame)`,
);
