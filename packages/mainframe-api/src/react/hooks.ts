import useSWR from "swr";

export function useMainframeTable<T = any>({
  tableId,
  apiUrl = "https://api.mainframe.so",
  apiKey,
}: {
  tableId: string;
  apiUrl?: string;
  apiKey: string;
}) {
  const { data, ...props } = useSWR(
    apiKey
      ? {
          kind: "mainframe",
          url: `${apiUrl}/api/table/${tableId}/rows`,
          apiKey,
        }
      : null,
    async ({ url, apiKey }) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      // TODO: Types
      const json = (await res.json()) as T[];
      return json;
    },
  );
  return { data: data, ...props };
}

export function useMainframeObject<T = any>({
  datasetId,
  objectType,
  apiUrl = "https://api.mainframe.so",
  apiKey,
}: {
  datasetId: string;
  objectType: string;
  apiUrl?: string;
  apiKey: string;
}) {
  const { data, ...props } = useSWR(
    apiKey
      ? {
          kind: "mainframe",
          url: `${apiUrl}/api/object/${datasetId}/${objectType}`,
          apiKey,
        }
      : null,
    async ({ url, apiKey }) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      // TODO: Types
      const json = (await res.json()) as { id: string; data: T };
      return json;
    },
  );
  return { data: data?.data, ...props };
}

export type CredentialsObject = { token: string };

export function useMainframeCredentials<ARGS extends any[] = [], T = any>(
  {
    datasetId,
    args = [] as any[] as ARGS,
    apiUrl = "https://api.mainframe.so",
    apiKey,
  }: {
    datasetId: string;
    args?: ARGS;
    apiUrl?: string;
    apiKey: string;
  },
  callback: (creds: CredentialsObject, ...args: ARGS) => Promise<T> | T,
) {
  const { data, ...props } = useSWR(
    apiKey
      ? {
          kind: "mainframe",
          url: `${apiUrl}/api/credentials/${datasetId}`,
          apiKey,
        }
      : null,
    async ({ url, apiKey }) => {
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const creds = (await res.json()) as CredentialsObject;
      return await callback(creds, ...args);
    },
  );
  return { data, ...props };
}
