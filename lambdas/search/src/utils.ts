export function compareTags(
  tags1: Record<string, string>,
  tags2: Record<string, string>
) {
  const keys1 = Object.keys(tags1);
  const keys2 = Object.keys(tags2);
  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    if (tags1[key] !== tags2[key]) {
      return false;
    }
  }
  return true;
}
