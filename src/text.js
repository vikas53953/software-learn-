// Text helpers shared by the lesson renderer. Everything that reaches innerHTML goes through esc().
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Minimal inline markdown, applied after escaping:
 * `code`, **bold**, and [[term|words]] for a glossary word the learner can tap.
 * The term key is limited to [a-z0-9-], so nothing user-controlled reaches an attribute unescaped.
 */
export const md = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[\[([a-z0-9-]+)\|([^[\]]+)\]\]/g, '<button type="button" class="term-btn" data-term="$1">$2</button>');
