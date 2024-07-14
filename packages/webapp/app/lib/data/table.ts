import { useCallback, useEffect } from "react";
import { useOperationsData } from "../hooks/use-operations";
import { trpc } from "../trpc_client";
import { zTableOperation } from "@mainframe-api/shared";
import { z } from "zod";

export function useTable(
  datasetId: string | undefined,
  tableId: string | undefined,
) {
  const { refetch, ...props } = trpc.tablesPageLoader.useQuery({
    datasetId,
    tableId,
  });
  const syncTable = trpc.syncTable.useMutation();
  useEffect(() => {
    if (datasetId && tableId) {
      syncTable.mutate({ datasetId, tableId });
    }
  }, [datasetId, tableId]);
  const callback = useCallback((event: z.infer<typeof zTableOperation>) => {
    if (event?.datasetId === datasetId && event?.tableId === tableId) {
      refetch();
    }
  }, []);
  useOperationsData(zTableOperation, callback);
  return { refetch, ...props };
}
