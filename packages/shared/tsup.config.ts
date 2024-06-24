import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts"],
  format: ["esm", "cjs"],
  clean: true,
  sourcemap: true,
  splitting: false,
  minify: false,

  ignoreWatch: [
    "**/.turbo",
    "**/dist",
    "**/node_modules",
    "**/.DS_STORE",
    "**/.git",
  ],
  onSuccess: "tsc --emitDeclarationOnly --declaration",

  // We set `bundle: true`, but we set every file import as an external import,
  // effectively preventing bundling from happening. We do this to rename .ts
  // imports to .js
  bundle: true,
  esbuildPlugins: [
    {
      name: "replace-ts-with-js",
      setup(build) {
        build.onResolve({ filter: /\.[jt]sx?$/ }, (args) => {
          if (args.importer && args.path.match(/\.tsx?$/)) {
            return {
              path: args.path.replace(/\.t(sx?)$/, ".j$1"),
              external: true,
            };
          }
          if (args.kind !== "entry-point") {
            return { path: args.path, external: true };
          }
        });
      },
    },
  ],
});
