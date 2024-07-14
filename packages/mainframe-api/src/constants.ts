import { HostConfig } from "./types";

export const DEFAULT_HOSTS = {
  rootUrl: "https://app.mainframe.so",
  apiUrl: "https://api.mainframe.so",
} satisfies Required<HostConfig>;
