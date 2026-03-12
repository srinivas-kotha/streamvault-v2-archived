export function parseGenres(genreStr: string | undefined | null): string[] {
  if (!genreStr) return [];
  return genreStr
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
    .filter((g, i, arr) => arr.indexOf(g) === i); // dedupe
}

export function collectAllGenres(items: Array<{ genre?: string }>): string[] {
  const all = new Set<string>();
  for (const item of items) {
    for (const g of parseGenres(item.genre)) {
      all.add(g);
    }
  }
  return Array.from(all).sort();
}
