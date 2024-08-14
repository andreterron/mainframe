import { MainframeSessionStore } from "../types";

export class NoopMainframeSessionStore implements MainframeSessionStore {
  constructor() {}
  get(): string | undefined {
    return undefined;
  }
  set(session: string): void {}
  clear(): void {}
}
