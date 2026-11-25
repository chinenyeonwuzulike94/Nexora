const normalize = value => String(value ?? '').trim().toLowerCase();
export function matchesGenre(value, requested) {
  if (!requested || normalize(requested) === 'all') return true;
  const genres = String(value ?? '').split(',').map(normalize).filter(Boolean);
  const target = normalize(requested);
  if (genres.includes(target)) return true;
  return target === 'science fiction' ? genres.includes('sci-fi') : target === 'sci-fi' && genres.includes('science fiction');
}
export function filterCatalogue(items, filters = {}) {
  const q = normalize(filters.q);
  const result = items.filter(item => {
    const haystack = normalize([item.title,item.genre,item.platform,item.description].filter(Boolean).join(' '));
    return (!q || haystack.includes(q))
      && matchesGenre(item.genre, filters.genre)
      && (!filters.type || filters.type === 'All' || item.type === filters.type)
      && (!filters.platform || normalize(item.platform) === normalize(filters.platform))
      && (!filters.year || String(item.year) === String(filters.year))
      && (!filters.language || normalize(item.originalLanguage) === normalize(filters.language))
      && (!filters.country || filters.country.split(',').map(normalize).includes(normalize(item.country)));
  });
  if (filters.sort === 'rating') result.sort((a,b) => Number(b.rating || 0) - Number(a.rating || 0));
  if (filters.sort === 'year') result.sort((a,b) => Number(b.year || 0) - Number(a.year || 0));
  if (filters.sort === 'recently-added') result.sort((a,b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  return result;
}
