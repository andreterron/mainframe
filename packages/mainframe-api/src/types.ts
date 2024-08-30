import { supportedConnectProviders } from "@mainframe-api/server";

export interface HostConfig {
  apiUrl?: string;
}

export interface MainframeSessionStore {
  get(): string | undefined | Promise<string | undefined>;
  set(value: string): void | Promise<void>;
  clear(): void | Promise<void>;
}

export interface MainframeClientConfig extends HostConfig {
  appId: string;
  sessionStore?: MainframeSessionStore;
}

export type ProviderName = (typeof supportedConnectProviders)[number];
