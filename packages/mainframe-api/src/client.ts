import { createApiClient } from "./api-client";
import { Connection } from "./connection";
import { DEFAULT_HOSTS, MAINFRAME_SESSION_HEADER } from "./constants";
import { LocalStorageMainframeSessionStore } from "./session-storage";
import {
  MainframeClientConfig,
  MainframeSessionStore,
  ProviderName,
} from "./types";

export class Mainframe {
  readonly sessionStore: MainframeSessionStore;

  constructor(private _config: MainframeClientConfig) {
    this.sessionStore =
      _config.sessionStore ?? new LocalStorageMainframeSessionStore();
  }

  get appId() {
    return this.config.appId;
  }

  get config() {
    return { ...DEFAULT_HOSTS, ...this._config };
  }

  api = createApiClient(this.config.apiUrl, {
    headers: async (): Promise<Record<string, string>> => {
      const session = await this.sessionStore.get();
      if (!session) {
        return {};
      }
      return {
        Authorization: `Bearer ${session}`,
      };
    },
    fetch: async (input, requestInit, Env, executionCtx) => {
      const res = await fetch(input, requestInit);
      const session = res.headers.get(MAINFRAME_SESSION_HEADER);
      if (session) {
        await this.sessionStore.set(session);
      }
      return res;
    },
  });

  async initiateAuth(
    provider: ProviderName,
    configOverride?: Partial<MainframeClientConfig>,
  ) {
    const config = { ...this.config, ...configOverride };
    const { id, connectUrl } = await this.prepareConnection(provider);
    // TODO: Remove appId and provider from URL
    const w = window.open(connectUrl, "_blank");

    return new Promise<Connection>((resolve, reject) => {
      const recheck = async () => {
        // TODO: Only remove listeners and remove if the check was successful.
        // w?.removeEventListener("message", messageCallback);
        // TODO: Check for window.closed probably isn't a good indicator
        const connection = await this.getConnection(id);

        if (connection.connected) {
          window.removeEventListener("focus", recheck);
          // Check if we can do this
          if (!w?.closed) {
            w?.close();
          }
          resolve(new Connection(connection, config, this.sessionStore));
          return;
        }

        if (w?.closed) {
          window.removeEventListener("focus", recheck);
          reject(new Error("Connection cancelled"));
          return;
        }
      };
      // w?.addEventListener("message", (event) => {
      //   // TODO: Try to use window events to get the id of the connection so we can await the auth flow.
      //   // TODO: Only accept messages from the expected event.origin
      // });
      window.addEventListener("focus", recheck);
      // TODO: Timeout. reject
    });
  }

  async disconnect() {
    const res = await this.api.connect.sessions.$delete();

    // NOTE: we await the API call to ensure the session isn't cleared
    // before we try to delete it in the server.
    await this.sessionStore.clear();

    if (!res.ok) {
      console.error("Failed to delete session on server");
      // TODO: Report error
    }
  }

  private async prepareConnection(provider: ProviderName) {
    const res = await this.api.connect.apps[":app_id"].connections.$post({
      param: {
        app_id: this.appId,
      },
      json: {
        provider,
      },
    });

    if (!res.ok) {
      throw new Error("Failed to initiate connection");
    }

    return res.json();
  }

  private async getConnection(connectionId: string) {
    const res = await this.api.connect.apps[":app_id"].connections[
      ":connection_id"
    ].$get({
      param: {
        app_id: this.appId,
        connection_id: connectionId,
      },
    });

    if (!res.ok) {
      throw new Error(
        `Failed to retrieve connection. HTTP Status Code: ${res.status}`,
      );
    }

    return res.json();
  }
}
