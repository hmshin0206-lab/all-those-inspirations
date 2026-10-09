// One-off importer: WordPress.com REST API JSON -> src/content/*.md + public/images/*
// Usage: node scripts/import-wordpress.mjs <dir containing posts*.json and pages.json>
import fs from 'node:fs/promises';
import path from 'node:path';
import TurndownService from 'turndown';

const dataDir = process.argv[2];
if (!dataDir) throw new Error('Pass the directory holding posts*.json / pages.json');
const root = path.resolve(import.meta.dirname, '..');

const STUDY = new Set([
  'w2-empathize', 'w3-define', 'w4-persona', 'w5-social-pressure-mindfulness', 'w6-feedback',
  'afterglow-of-the-eight-weeks', 'design-thinking', 'data-visualization',
  'marketing-research-note-1-chi-squared-t-test', 'how-to-take-smart-notes-that-sticks',
  'book-review-the-language-of-food-from-a-marketers-point-of-view', 'courage-to-be-disliked',
  'change-by-design', 'believing-is-seeing', 'design-better-forms', 'key-digital-marketing-metrics-used-in-line',
  'guesstimation', '10-ways-to-have-better-conversation', 'gartner-top-10-strategic-technology-trends-for-2018',
  'business-intelligence-for-marketers-resource-guide', 'insider-guide-to-koreas-tech-and-startup-ecosystem-in-2017',
  '10-best-app-ui-design-for-your-inspiration-in-2017',
]);
const YEARBOOK = new Set([
  '2025-retrospective-navigating-transitions-and-doubling-down-on-strengths',
  'my-2020-covid-maternity-leave-and-books', '2018-reflections-3-best-things-i-ever-did',
]);
const LIFE = new Set(['bullet-journaling']);

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…');

function categoryOf(slug, cats) {
  if (STUDY.has(slug)) return 'study';
  if (YEARBOOK.has(slug)) return 'essays';
  if (LIFE.has(slug)) return 'life';
  const onlyLife = cats.includes('Life Notes') && !cats.some((c) => c === 'Career' || c.startsWith('Product'));
  return onlyLife ? 'life' : 'essays';
}

function topicsOf(cats, tags, title) {
  const t = tags.map((x) => x.toLowerCase());
  const has = (...keys) => t.some((x) => keys.some((k) => x === k || x.includes(k)));
  const out = [];
  if (t.some((x) => x === 'ai' || x.startsWith('ai ') || x.includes(' ai') || x === 'chatgpt')) out.push('AI');
  if (has('design thinking', 'design leadership', 'ux')) out.push('Design Thinking');
  if (has('marketing', 'commercial', 'branding', 'metrics', 'advertisement', 'best ads')) out.push('Marketing');
  if (has('book')) out.push('Books');
  if (has('reflection', 'year in review', 'my 2020') || /retrospective|reflections/i.test(title)) out.push('Reflection');
  if (cats.includes('Career')) out.push('Career');
  return out.slice(0, 3);
}

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
td.keep(['iframe']);
td.addRule('figure', { filter: 'figure', replacement: (c) => `\n\n${c.trim()}\n\n` });
td.addRule('figcaption', { filter: 'figcaption', replacement: (c) => (c.trim() ? `\n\n<small class="caption">${c.trim()}</small>\n\n` : '') });

const isWpHost = (u) => /(^|\.)wordpress\.com$|(^|\.)wp\.com$/.test(new URL(u).hostname);
let failed = 0;

async function download(url, dir, name) {
  const u = new URL(url);
  u.search = '?w=1400';
  const ext = (path.extname(u.pathname) || '.jpg').toLowerCase();
  const base = path.basename(u.pathname, path.extname(u.pathname)).replace(/[^a-zA-Z0-9-]+/g, '-').slice(0, 50) || 'image';
  const file = `${name}-${base}${ext}`;
  const abs = path.join(root, 'public', dir, file);
  try {
    await fs.access(abs);
  } catch {
    const res = await fetch(u, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`${res.status} ${u}`);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, Buffer.from(await res.arrayBuffer()));
  }
  return `/${dir}/${file}`;
}

async function localize(html, dir) {
  html = html.replace(/<a [^>]*href="[^"]*(?:wp-content\/uploads|files\.wordpress\.com)[^"]*"[^>]*>(\s*<img[^>]*>\s*)<\/a>/g, '$1');
  const tags = [...html.matchAll(/<img[^>]*>/g)].map((m) => m[0]);
  let i = 0;
  for (const tag of tags) {
    const src = decode(tag.match(/\ssrc="([^"]+)"/)?.[1] ?? '');
    const alt = decode(tag.match(/\salt="([^"]*)"/)?.[1] ?? '');
    if (/wp-smiley|emoji/.test(tag)) { html = html.replace(tag, alt); continue; }
    if (!src) continue;
    let out = src;
    try {
      if (isWpHost(src)) out = await download(src, dir, String(++i).padStart(2, '0'));
    } catch (e) { failed++; console.warn('  image kept remote:', e.message); }
    html = html.replace(tag, `<img src="${out}" alt="${alt.replace(/"/g, '&quot;')}">`);
  }
  return html;
}

const yaml = (obj) => Object.entries(obj)
  .filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length))
  .map(([k, v]) => `${k}: ${Array.isArray(v) ? `[${v.map((x) => JSON.stringify(x)).join(', ')}]` : typeof v === 'string' ? JSON.stringify(v) : v}`)
  .join('\n');

const read = async (f) => JSON.parse(await fs.readFile(path.join(dataDir, f), 'utf8')).posts;
const posts = [...(await read('posts.json')), ...(await read('posts2.json'))];
await fs.mkdir(path.join(root, 'src/content/posts'), { recursive: true });
await fs.mkdir(path.join(root, 'src/content/pages'), { recursive: true });

for (const p of posts) {
  const cats = Object.keys(p.categories).map(decode);
  const tags = Object.keys(p.tags).map(decode);
  const title = decode(p.title);
  const dir = `images/posts/${p.slug}`;
  const body = td.turndown(await localize(p.content, dir)).replace(/\n{3,}/g, '\n\n');
  let cover;
  if (p.featured_image) {
    try { cover = await download(p.featured_image, dir, 'cover'); } catch (e) { failed++; console.warn('  cover skipped:', e.message); }
  }
  const description = decode(p.excerpt.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim().slice(0, 200);
  const fm = yaml({
    title, date: p.date, category: categoryOf(p.slug, cats), topics: topicsOf(cats, tags, title),
    series: YEARBOOK.has(p.slug) ? 'Yearbook' : undefined, stage: 'evergreen', description, cover, wpUrl: p.URL,
  });
  await fs.writeFile(path.join(root, 'src/content/posts', `${p.slug}.md`), `---\n${fm}\n---\n\n${body}\n`);
  console.log(p.date.slice(0, 10), p.slug);
}

for (const pg of await read('pages.json')) {
  if (!['about', 'portfolio'].includes(pg.slug)) continue;
  const body = td.turndown(await localize(pg.content, `images/pages/${pg.slug}`)).replace(/\n{3,}/g, '\n\n');
  await fs.writeFile(path.join(root, 'src/content/pages', `${pg.slug}.md`), `---\n${yaml({ title: decode(pg.title) })}\n---\n\n${body}\n`);
  console.log('page', pg.slug);
}
console.log(`done: ${posts.length} posts, ${failed} images not downloaded`);
