import { DEFAULT_HOSTS } from "./constants";
import { HostConfig, ProviderName } from "./types";

function joinPaths(path1: string, path2: string) {
  return `${path1.replace(/\/$/, "")}/${path2.replace(/^\//, "")}`;
}

export class Connection {
  id: string;
  connected: boolean;
  provider: ProviderName;

  constructor(
    init: { id: string; connected: boolean; provider: ProviderName },
    readonly config: HostConfig,
  ) {
    this.id = init.id;
    this.connected = init.connected;
    this.provider = init.provider;
  }

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
