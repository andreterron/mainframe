import { LOCALSTORAGE_KEY } from "./constants";
import { MainframeSessionStore } from "./types";

export class LocalStorageMainframeSessionStore
  implements MainframeSessionStore
{
  private _mainframeSession: string | undefined =
    localStorage.getItem(LOCALSTORAGE_KEY) ?? undefined;
  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.storageArea === localStorage && e.key === LOCALSTORAGE_KEY) {
          this._mainframeSession = e.newValue ?? undefined;
        }
      });
    }
  }
  get(): string | undefined {
    return this._mainframeSession;
  }
  set(session: string): void {
    this._mainframeSession = session;
    localStorage.setItem(LOCALSTORAGE_KEY, session);
  }
  clear(): void {
    this._mainframeSession = undefined;
    localStorage.removeItem(LOCALSTORAGE_KEY);
  }
}
