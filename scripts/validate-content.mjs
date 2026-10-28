// Sanity checks for lesson content: diagram references and quiz answers.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.mdx') ? [p] : [];
  });
}

// Extract the JS expression inside prop={...} starting at index, matching braces.
function extract(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start + 1, i);
    }
  }
  throw new Error('unbalanced braces');
}

function props(block, name) {
  const idx = block.indexOf(`${name}={`);
  if (idx < 0) return undefined;
  return Function(`return (${extract(block, idx + name.length + 1)})`)();
}

function tags(src, tag) {
  const out = [];
  let i = 0;
  while ((i = src.indexOf(`<${tag}`, i)) >= 0) {
    const end = src.indexOf('/>', i);
    out.push(src.slice(i, end));
    i = end;
  }
  return out;
}

let errors = 0;
const stats = { flows: 0, seq: 0, quiz: 0 };
const fail = (file, msg) => {
  errors++;
  console.error(`✗ ${file}: ${msg}`);
};

for (const file of walk('src/content/lessons')) {
  const src = readFileSync(file, 'utf8');
  for (const block of tags(src, 'ArchFlow')) {
    stats.flows++;
    const nodes = props(block, 'nodes') ?? [];
    const edges = props(block, 'edges') ?? [];
    const steps = props(block, 'steps') ?? [];
    const ids = new Set(nodes.map((n) => n.id));
    const keys = new Set(edges.map((e) => `${e.from}>${e.to}`));
    for (const e of edges) if (!ids.has(e.from) || !ids.has(e.to)) fail(file, `edge ${e.from}>${e.to} references missing node`);
    for (const s of steps) {
      for (const a of [...(s.add ?? []), ...(s.remove ?? [])]) if (!ids.has(a) && !keys.has(a)) fail(file, `step "${s.title}" adds/removes unknown "${a}"`);
      for (const f of s.flow ?? []) {
        const [x, y] = f.split('>');
        if (!keys.has(f) && !keys.has(`${y}>${x}`)) fail(file, `step "${s.title}" flows on missing edge "${f}"`);
      }
      for (const h of s.highlight ?? []) if (!ids.has(h)) fail(file, `step "${s.title}" highlights unknown "${h}"`);
    }
  }
  for (const block of tags(src, 'SequenceFlow')) {
    stats.seq++;
    const actors = new Set((props(block, 'actors') ?? []).map((a) => a.id));
    for (const m of props(block, 'messages') ?? []) if (!actors.has(m.from) || !actors.has(m.to)) fail(file, `message "${m.label}" uses unknown actor`);
  }
  for (const block of tags(src, 'Quiz')) {
    stats.quiz++;
    const qs = props(block, 'questions') ?? [];
    qs.forEach((q, i) => {
      if (!(q.answer >= 0 && q.answer < q.options.length)) fail(file, `quiz question ${i + 1} answer index out of range`);
    });
  }
}

if (errors) {
  console.error(`\n${errors} problem(s) found.`);
  process.exit(1);
}
console.log(`Content OK. Checked ${stats.flows} diagrams, ${stats.seq} sequences, ${stats.quiz} quizzes.`);
