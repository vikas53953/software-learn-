// Tiny, dependency-free syntax highlighter for the snippets in lessons.
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const KW = {
  ts: 'abstract async await break case catch class const constructor continue default else export extends finally for from function if implements import interface let new of private public readonly return static switch this throw try type void while',
  sql: 'select from where update set and or is null insert into values begin commit rollback for as not in',
  yaml: 'on true false',
};
KW.js = KW.ts;

export function highlight(src, lang = 'ts') {
  if (lang === 'text') return esc(src);
  const words = new Set((KW[lang] || KW.ts).split(' '));
  const comment = lang === 'sql' ? /--[^\n]*/y : lang === 'yaml' ? /#[^\n]*/y : /\/\/[^\n]*|\/\*[\s\S]*?\*\//y;
  const rules = [
    ['c', comment],
    ['s', /'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/y],
    ['k', /^\s*[\w-]+(?=:)/my],
    ['n', /\b\d[\d_.]*\b/y],
    ['w', /[A-Za-z_$][\w$]*/y],
  ];
  let out = '', i = 0;
  outer: while (i < src.length) {
    for (const [kind, re] of rules) {
      if (kind === 'k' && lang !== 'yaml') continue;
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m.index === i && m[0].length) {
        const t = esc(m[0]);
        if (kind === 'w') {
          const isKw = words.has(lang === 'sql' ? m[0].toLowerCase() : m[0]);
          const isType = /^[A-Z]/.test(m[0]) && lang !== 'sql';
          const isCall = src[i + m[0].length] === '(';
          out += isKw ? `<span class="tk-k">${t}</span>` : isType ? `<span class="tk-t">${t}</span>` : isCall ? `<span class="tk-f">${t}</span>` : t;
        } else out += `<span class="tk-${kind}">${t}</span>`;
        i += m[0].length;
        continue outer;
      }
    }
    out += esc(src[i]);
    i++;
  }
  return out;
}
