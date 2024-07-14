interface ObjectConstructor {
  // Fallback to string to maintain compatibility with original Object.keys
  keys<T extends object>(o: T): (keyof T extends never ? string : keyof T)[];
}
