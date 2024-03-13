export function serialize(data: any) {
  return data === undefined ? null : JSON.stringify(data);
}
export function deserialize(field: string | null) {
  return field === null ? undefined : JSON.parse(field);
}

export function deserializeData<T extends { data: string | null }>(
  value: T,
): Omit<T, "data"> & { data: Record<string, any> } {
  return { ...value, data: deserialize(value.data) };
}
