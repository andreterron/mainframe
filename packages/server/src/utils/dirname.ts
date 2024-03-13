import { fileURLToPath } from "url";
import path from "path";

export function __dirnameFromImportMetaUrl(url: string) {
  return path.dirname(fileURLToPath(url));
}
