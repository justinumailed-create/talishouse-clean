/** `fmt("Hello {name}", { name: "Ana" })` → "Hello Ana". Unknown tokens stay. */
export function fmt(
  template: string,
  values: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? match : String(value);
  });
}
