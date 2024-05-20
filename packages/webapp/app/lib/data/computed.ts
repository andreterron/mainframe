import { trpc } from "../trpc_client";

export function useComputed(
  datasetId: string | undefined,
  functionId: string | undefined,
  params: Record<string, string> | undefined,
) {
  const { refetch, ...props } = trpc.getComputedData.useQuery(
    {
      datasetId,
      functionName: functionId,
      params,
    },
    {
      keepPreviousData: true,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  );
  // TODO: Auto-update when it's syncing
  // const callback = useCallback((event: z.infer<typeof zTableOperation>) => {
  //   if (event?.datasetId === datasetId && event?.tableId === tableId) {
  //     refetch();
  //   }
  // }, []);
  // useOperationsData(zTableOperation, callback);
  return { refetch, ...props };
}
