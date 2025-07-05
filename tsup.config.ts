import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/express/index.ts"],
  format: ["esm", "cjs"],
  target: "node18",
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
});
