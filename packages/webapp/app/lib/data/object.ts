import { useEffect } from "react";
import { useOperationsData } from "../hooks/use-operations";
import { trpc } from "../trpc_client";
import { zObjectOperation, zTableOperation } from "@mainframe-so/shared";

export function useObject(
  datasetId: string | undefined,
  objectType: string | undefined,
) {
  const { refetch, ...props } = trpc.getObjectAndDataset.useQuery({
    datasetId,
    objectType,
  });
  const syncObject = trpc.syncObject.useMutation();
  useEffect(() => {
    if (datasetId && objectType) {
      syncObject.mutate({ datasetId, objectType });
    }
  }, [datasetId, objectType]);
  useOperationsData(zObjectOperation, (event) => {
    if (event?.datasetId === datasetId && event?.objectType === objectType) {
      refetch();
    }
  });
  return { refetch, ...props };
}
