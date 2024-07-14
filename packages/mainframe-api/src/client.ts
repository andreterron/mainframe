import { Connection } from "./connection";
import { DEFAULT_HOSTS } from "./constants";
import { MainframeClientConfig } from "./types";

async function getConnectionId(
  provider: "github",
  config: Required<MainframeClientConfig>,
) {
  const res = await fetch(
    `${config.apiUrl}/connect/apps/${config.appId}/connections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
      }),
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to initiate connection");
  }

  const body = (await res.json()) as { id: string };

  return body.id;
}

async function getConnection(
  connectionId: string,
  config: Required<MainframeClientConfig>,
) {
  const res = await fetch(
    `${config.apiUrl}/connect/apps/${config.appId}/connections/${connectionId}`,
    {
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to retrieve connection. HTTP Status Code: ${res.status}`,
    );
  }

  // TODO: zod
  const body = (await res.json()) as {
    id: string;
    sessionId?: string;
    connected: boolean;
    provider: "github";
  };

  return body;
}

export class Mainframe {
  constructor(private config: MainframeClientConfig) {}

  async initiateAuth(
    provider: "github",
    configOverride?: Partial<MainframeClientConfig>,
  ) {
    const config = { ...DEFAULT_HOSTS, ...this.config, ...configOverride };
    // TODO: Get the destination URL here
    const connectionId = await getConnectionId(provider, config);
    // TODO: Remove appId and provider from URL
    const w = window.open(
      `${config.rootUrl}/connect/${config.appId}/${connectionId}/${provider}`,
      "_blank",
    );

    await new Promise<void>((resolve, reject) => {
      async function recheck() {
        // TODO: Only remove listeners and remove if the check was successful.
        // w?.removeEventListener("message", messageCallback);
        // TODO: Check for window.closed probably isn't a good indicator
        const connection = await getConnection(connectionId, config);

        if (connection.connected) {
          window.removeEventListener("focus", recheck);
          // Check if we can do this
          if (!w?.closed) {
            w?.close();
          }
          resolve();
          return;
        }

        if (w?.closed) {
          window.removeEventListener("focus", recheck);
          reject(new Error("Connection cancelled"));
          return;
        }
      }
      // w?.addEventListener("message", (event) => {
      //   // TODO: Try to use window events to get the id of the connection so we can await the auth flow.
      //   // TODO: Only accept messages from the expected event.origin
      // });
      window.addEventListener("focus", recheck);
      // TODO: Timeout. reject
    });

    return new Connection(connectionId, config);
  }
}
