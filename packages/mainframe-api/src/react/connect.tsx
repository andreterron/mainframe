import React, {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
} from "react";
import { Mainframe } from "../client";
import { type MainframeClientConfig } from "../types";

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
