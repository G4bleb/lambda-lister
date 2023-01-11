export function compareTags(
  resource: Record<string, string>,
  filter: Record<string, string>
) {
  for (const key in filter) {
    if (filter[key] !== resource[key]) {
      return false;
    }
  }
  return true;
}
