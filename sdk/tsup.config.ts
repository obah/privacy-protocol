import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "index.ts",
    "core/index": "core/index.ts",
    "hooks/index": "hooks/index.ts",
  },
  format: ["esm"],
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  target: "es2020",
  platform: "browser",
  noExternal: [/^@aztec\/bb\.js/],
  external: ["react"],
});
