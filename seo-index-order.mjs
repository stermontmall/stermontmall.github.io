// Check pages with no saved result first, then the ones checked longest ago.
export function prioritise(urls, checked, max) {
  const age = u => checked.has(u) ? new Date(checked.get(u)).getTime() : -1;
  return [...urls].sort((a, b) => age(a) - age(b)).slice(0, max);
}
