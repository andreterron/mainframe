export interface HostConfig {
  apiUrl?: string;
  rootUrl?: string;
}

export interface MainframeClientConfig extends HostConfig {
  appId: string;
}
