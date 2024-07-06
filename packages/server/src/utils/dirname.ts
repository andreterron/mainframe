import { fileURLToPath } from "node:url";
import path from "node:path";

export function __dirnameFromImportMetaUrl(url: string) {
  return path.dirname(fileURLToPath(url));
}

export function src__dirnameFromImportMetaUrl(url: string) {
  const distDirname = __dirnameFromImportMetaUrl(url);
  const matches = Array.from(distDirname.matchAll(/(^|\/)dist(\/|$)/g));
  const i = matches.at(-1)?.index;
  if (i === undefined) {
    return distDirname;
  }
  return `${distDirname.substring(0, i)}${distDirname
    .slice(i)
    .replace(/(^|\/)dist(\/|$)/, "$1src$2")}`;
}
