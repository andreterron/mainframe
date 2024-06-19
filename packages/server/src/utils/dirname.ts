import { fileURLToPath } from "node:url";
import path from "node:path";

export function __dirnameFromImportMetaUrl(url: string) {
  return path.dirname(fileURLToPath(url));
}
