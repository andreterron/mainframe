import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,

  // sourcemap: true,
  // bundle: false,

  // splitting: false,
  // treeshake: true,
  // minify: false,
  // platform: "node",
  // shims: true,
  // ignoreWatch: [
  //   "**/.turbo",
  //   "**/dist",
  //   "**/node_modules",
  //   "**/.DS_STORE",
  //   "**/.git",
  // ],
});
