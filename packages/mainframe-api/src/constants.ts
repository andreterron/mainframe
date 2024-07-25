import { HostConfig } from "./types";

export const DEFAULT_HOSTS = {
  apiUrl: "https://api.mainframe.so",
} satisfies Required<HostConfig>;

export const MAINFRAME_SESSION_HEADER = "X-Mainframe-Session";
export const MAINFRAME_PROXY_HEADER = "X-Mainframe-Authorization";

export const LOCALSTORAGE_KEY = "__mainframe.session";
