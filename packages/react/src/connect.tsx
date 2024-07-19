import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";
import {
  Connection,
  Mainframe,
  type MainframeClientConfig,
} from "mainframe-api";
import useSWR from "swr";

export * from "mainframe-api";

const mainframeReactContext = createContext<Mainframe | undefined>(undefined);

export function MainframeProvider({
  config,
  children,
}: PropsWithChildren<{ config: MainframeClientConfig }>) {
  const mainframe = useMemo(() => new Mainframe(config), [config]);
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

  return useSWR("__mainframe.connections", async (arg) => {
    const res = await client.api.apps[":app_id"].connections.$get({
      param: {
        app_id: client.appId,
      },
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const connections = await res.json();
    return connections.map((c) => new Connection(c, client.config));
  });
}

export function useProxyGetter<T>(
  connection: Connection | undefined,
  fetcher: (connection: Connection) => Promise<T> | T,
) {
  return useSWR(
    ["__mainframe.connection.proxy_get", connection] as const,
    async ([, conn]) => {
      if (!conn) {
        return undefined;
      }
      return fetcher(conn);
    },
  );
}

// TODO: Use mutation
