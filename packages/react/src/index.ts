import useSWR from "swr";

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
