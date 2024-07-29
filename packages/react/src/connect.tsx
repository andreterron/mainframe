import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  Connection,
  Mainframe,
  ProviderName,
  type HostConfig,
} from "mainframe-api";
import useSWR from "swr";
import MimeType from "whatwg-mimetype";

export * from "mainframe-api";

const mainframeReactContext = createContext<Mainframe | undefined>(undefined);

export function MainframeProvider({
  appId,
  config,
  children,
}: PropsWithChildren<{ appId: string; config?: HostConfig }>) {
  const mainframe = useMemo(
    () => new Mainframe({ ...config, appId }),
    [appId, config],
  );
  return (
    <mainframeReactContext.Provider value={mainframe}>
      {children}
    </mainframeReactContext.Provider>
  );
}

export function useMainframeClient() {
  const client = useContext(mainframeReactContext);
  if (!client) {
    // TODO: Link to docs
    throw new Error("Please add a MainframeProvider");
  }
  return client;
}

export function useConnections() {
  const client = useMainframeClient();

  return useSWR(
    "__mainframe.connections",
    async () => {
      const res = await client.api.connect.apps[":app_id"].connections.$get({
        param: {
          app_id: client.appId,
        },
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const connections = await res.json();
      return connections.map(
        (c) => new Connection(c, client.config, client.sessionStore),
      );
    },
    {
      compare(a, b) {
        if (!a && !b) {
          return true;
        }
        if (!a || !b || a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (
            a[i]!.id !== b[i]!.id ||
            a[i]!.config.apiUrl !== b[i]!.config.apiUrl ||
            a[i]!.provider !== b[i]!.provider
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );
}

// TODO: Let the developer provide a unique ID
export function useConnection(provider: ProviderName) {
  const mainframe = useMainframeClient();
  const { data: connections, isLoading, mutate } = useConnections();

  const connection = connections?.find((c) => c.provider === provider);

  return {
    connection,
    isLoading,
    initiateAuth: () => mainframe.initiateAuth(provider),
    disconnect: async () => {
      await mainframe.disconnect();
      await mutate();
    },
  };
}

/**
 * @param contentType "Content-Type" header value
 * @returns true if mimetype subtype ends in "+json" or if its essence is "application/json" or "text/json"
 * @see https://mimesniff.spec.whatwg.org/#json-mime-type
 */
function isJsonMimeType(contentType: string | null) {
  if (!contentType) {
    return false;
  }
  const mimeType = new MimeType(contentType);
  if (!mimeType) {
    return false;
  }
  return (
    ["application/json", "text/json"].includes(mimeType.essence) ||
    mimeType.subtype.endsWith("+json")
  );
}

export function useProxyGetter<T>(
  connection: Connection | undefined,
  fetcher: (connection: Connection) => Promise<T> | T,
) {
  const [key] = useState(Math.random());
  return useSWR(
    ["__mainframe.connection.proxy_get", connection, key] as const,
    async ([, conn]) => {
      if (!conn) {
        return undefined;
      }
      return fetcher(conn);
    },
  );
}

export function useRequest(
  connection: Connection | undefined,
  path: string,
  init?: RequestInit,
) {
  const {
    data: swrData,
    error,
    isLoading,
    isValidating,
  } = useSWR(
    // TODO: Check if we need to add `init` here
    ["__mainframe.connection.proxy_req", connection, path] as const,
    async ([, conn, path]) => {
      if (!conn) {
        return undefined;
      }
      const res = await conn.proxyFetch(path, init);

      // TODO: Support non-json
      const data =
        res.ok && isJsonMimeType(res.headers.get("content-type"))
          ? await res.json()
          : undefined;

      return { data, res };
    },
  );

  return {
    data: swrData?.data,
    res: swrData?.res,
    error,
    isLoading,
    isValidating,
  };
}

// TODO: Use mutation
