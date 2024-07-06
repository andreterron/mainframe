import { src__dirnameFromImportMetaUrl } from "./dirname";
import { expect, test } from "vitest";

test("doesn't change if there's no dist", () => {
  expect(src__dirnameFromImportMetaUrl("file:///foo/bar/index.ts")).toBe(
    "/foo/bar",
  );
});
test("replaces dist with src in the middle", () => {
  expect(src__dirnameFromImportMetaUrl("file:///foo/dist/bar/index.ts")).toBe(
    "/foo/src/bar",
  );
});
test("replaces dist with src in the beginning", () => {
  expect(src__dirnameFromImportMetaUrl("file:///dist/foo/bar/index.ts")).toBe(
    "/src/foo/bar",
  );
});
test("replaces dist with src in the end", () => {
  expect(src__dirnameFromImportMetaUrl("file:///foo/bar/dist/index.ts")).toBe(
    "/foo/bar/src",
  );
});
