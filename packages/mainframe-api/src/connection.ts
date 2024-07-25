import { DEFAULT_HOSTS, MAINFRAME_PROXY_HEADER } from "./constants";
import { HostConfig, MainframeSessionStore, ProviderName } from "./types";

function joinPaths(path1: string, path2: string) {
  return `${path1.replace(/\/$/, "")}/${path2.replace(/^\//, "")}`;
}

export class Connection {
  id: string;
  provider: ProviderName;

  constructor(
    init: { id: string; provider: ProviderName },
    readonly config: HostConfig,
    readonly sessionStore: MainframeSessionStore,
  ) {
    this.id = init.id;
    this.provider = init.provider;
  }

  async proxyFetch(
    path: string /* TODO: | URL | Request */,
    init?: RequestInit,
  ) {
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
    const session = await this.sessionStore.get();
    return fetch(url, {
      credentials: "include",
      ...init,
      ...(session
        ? {
            headers: {
              ...init?.headers,
              [MAINFRAME_PROXY_HEADER]: `Bearer ${session}`,
            },
          }
        : {}),
    });
  }
}
