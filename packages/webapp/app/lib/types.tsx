export type RowType = {
  data: Record<string, any>;
  id: string;
};
// OmitUndefined<OmitUndefined<ReturnType<typeof useTable>["data"]>["rows"]>[number]
