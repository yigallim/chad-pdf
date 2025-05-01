export const FONT_FALLBACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'";

export function withFallback(font: string) {
  return `${font} ${FONT_FALLBACK}`;
}

export function withSizeFallback(fontSize: number) {
  return `${fontSize}px ${FONT_FALLBACK}`;
}
