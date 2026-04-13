/**
 * Deterministic CSS gradient derived from a movie title.
 * Produces cinematic duotone gradients across a curated hue palette.
 */
export function posterGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) | 0;
  }
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40 + (Math.abs(hash >> 8) % 60)) % 360;
  const angle = 135 + (Math.abs(hash >> 4) % 90);
  return `linear-gradient(${angle}deg, hsl(${h1} 55% 22%) 0%, hsl(${h2} 70% 14%) 55%, hsl(${(h2 + 20) % 360} 40% 8%) 100%)`;
}
