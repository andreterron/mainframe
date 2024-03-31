import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { env } from "../env_client";
import { z, ZodType } from "zod";
import { trpc } from "../trpc_client";

const opContext = createContext<EventSource | null>(null);

export function useOperations() {
  return useContext(opContext);
}

export function useOperationListener(
  type: string,
  callback: (v: MessageEvent<string>) => void,
) {
  const ops = useOperations();

  useEffect(() => {
    if (!ops) return;
    ops.addEventListener(type, callback);
    return () => {
      ops.removeEventListener(type, callback);
    };
  }, [ops, type, callback]);
}

export function useOperationsData<T extends ZodType<any, any, any>>(
  validator: T,
  callback: (v: z.infer<T>) => void,
) {
  const listener = useCallback(
    (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data);
        const parsed = validator.safeParse(data);
        if (parsed.success) {
          callback(parsed.data);
        }
      } catch (e) {
        console.error(e);
      }
    },
    [validator, callback],
  );
  useOperationListener("message", listener);
}

export function OperationsProvider({ children }: PropsWithChildren<{}>) {
  const { data } = trpc.authInfo.useQuery();
  const eventSourceRef = useRef<EventSource | null>(null);
  const eventSource = useMemo(() => {
    const src = new EventSource(`${env.VITE_API_URL}/api/operations`, {
      withCredentials: true,
    });
    if (eventSourceRef.current?.readyState !== EventSource.CLOSED) {
      eventSourceRef.current?.close();
    }
    eventSourceRef.current = src;
    return src;
  }, [data?.isLoggedIn]);

  return (
    <opContext.Provider value={eventSource}>{children}</opContext.Provider>
  );
}
