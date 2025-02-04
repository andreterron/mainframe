// Maps over an object's keys with a callback
export function mapObject<T extends { [k: string]: any }, U>(
  obj: T,
  callback: (value: T[keyof T], key: keyof T) => U,
): Record<keyof T, U> {
  const result: Record<string, U> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = callback(value, key);
  }
  return result as Record<keyof T, U>;
}
