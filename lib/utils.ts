// lib/utils.ts
export function safeArray<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.values(data);
}
// ব্যবহার:
// const batsmen = safeArray<Batsman>(displayedInnings.batsmen);
// batsmen.map(...)