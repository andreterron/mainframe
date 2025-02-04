interface Array<T> {
  filter(predicate: typeof Boolean): Exclude<T, null | undefined>[];
}
