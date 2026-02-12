import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sdkRoot = resolve(__dirname, "..");
const distDir = resolve(sdkRoot, "dist");

const entries = [
  {
    entry: resolve(
      sdkRoot,
      "node_modules/@aztec/bb.js/dest/browser/barretenberg_wasm/barretenberg_wasm_main/factory/browser/main.worker.js",
    ),
    outfile: resolve(distDir, "main.worker.js"),
  },
  {
    entry: resolve(
      sdkRoot,
      "node_modules/@aztec/bb.js/dest/browser/barretenberg_wasm/barretenberg_wasm_thread/factory/browser/thread.worker.js",
    ),
    outfile: resolve(distDir, "thread.worker.js"),
  },
];

await mkdir(distDir, { recursive: true });

for (const { entry, outfile } of entries) {
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2020",
    sourcemap: true,
    logLevel: "info",
  });
}
