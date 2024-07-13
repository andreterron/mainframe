import { HostConfig } from "./types";

export const DEFAULT_HOSTS = {
  rootUrl: "https://mainframe.so",
  apiUrl: "https://api.mainframe.so",
} satisfies Required<HostConfig>;
