export function generateProjectCode(fastCode: string) {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${fastCode}-${rand}`;
}
