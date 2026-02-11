import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "index.ts",
    "core/index": "core/index.ts",
    "hooks/index": "hooks/index.ts",
  },
  format: ["esm", "cjs"],
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  target: "es2020",
  external: ["react"],
});
