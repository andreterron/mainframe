import { DEFAULT_HOSTS } from "./constants";
import { HostConfig } from "./types";

function joinPaths(path1: string, path2: string) {
  return `${path1.replace(/\/$/, "")}/${path2.replace(/^\//, "")}`;
}

export class Connection {
  constructor(public id: string, private config: HostConfig) {}

  proxyFetch(path: string /* TODO: | URL | Request */, init?: RequestInit) {
    const config = { ...DEFAULT_HOSTS, ...this.config };
    const proxyPathname = `connect/proxy/${this.id}`;
    const url = (() => {
      try {
        const url = new URL(proxyPathname, config.apiUrl);
        const inputUrl = new URL(path, url);
        inputUrl.protocol = url.protocol;
        inputUrl.host = url.host;
        inputUrl.pathname = joinPaths(url.pathname, inputUrl.pathname);
        return inputUrl;
      } catch (e) {
        console.error("URL method failed", e);
        return joinPaths(joinPaths(config.apiUrl, proxyPathname), path);
      }
    })();
    return fetch(url, {
      credentials: "include",
      ...init,
    });
  }
}
