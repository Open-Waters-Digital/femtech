/**
 * Paragraphs from a plain textarea, split on blank lines.
 *
 * The CMS copy is plain text rather than rich text: every block on this site is
 * a heading and some paragraphs, and a rich-text editor would let an editor set
 * a heading level or a colour the design does not have. A single line break
 * inside a paragraph is kept as a space.
 */
export function paragraphs(text: string | null | undefined): string[] {
  if (!text) return []
  return text
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.replace(/\s*\r?\n\s*/g, ' ').trim())
    .filter(Boolean)
}
