import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Category = Post['data']['category'];

export const SECTIONS = [
  { category: 'essays', slug: 'essays', title: 'Essays', blurb: '업계에서 보고, 일하며 생각한 것들.' },
  { category: 'study', slug: 'study-notes', title: 'Study Notes', blurb: '공부한 것들. 다 자란 노트도, 아직 자라는 노트도 있습니다.' },
  { category: 'build', slug: 'build-log', title: 'Build Log', blurb: '직접 만들어 본 것들의 기록.' },
] as const satisfies readonly { category: Category; slug: string; title: string; blurb: string }[];

export const CATEGORY_LABEL: Record<Category, string> = { essays: 'Essay', study: 'Study Note', build: 'Build Log', life: 'Life' };

export async function allPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', (p) => !p.data.draft);
  return posts.sort((a, b) => +b.data.date - +a.data.date);
}

export const postUrl = (p: Post) => `/posts/${p.id}/`;
export const fmtDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;

const plain = (md: string) => md.replace(/<[^>]+>/g, ' ').replace(/\]\([^)]*\)/g, ' ').replace(/[#*_>`![\]]/g, ' ');

export function readingMinutes(p: Post) {
  return Math.max(1, Math.round(plain(p.body ?? '').split(/\s+/).length / 220));
}

// "Machine margin": related notes by TF-IDF cosine similarity, computed at build time.
const STOP = new Set('that this with have from they were what when your about would there their which will been more some than them then into also just like because could other these those very much only over such most many even being after before while where every through'.split(' '));
const tokens = (p: Post) =>
  `${p.data.title} ${p.data.title} ${p.data.title} ${plain(p.body ?? '')}`.toLowerCase().match(/[a-z가-힣]{4,}/g)?.filter((w) => !STOP.has(w)) ?? [];

let vectors: Map<string, Map<string, number>> | undefined;
function build(posts: Post[]) {
  const tf = new Map(posts.map((p) => {
    const m = new Map<string, number>();
    for (const w of tokens(p)) m.set(w, (m.get(w) ?? 0) + 1);
    return [p.id, m] as const;
  }));
  const df = new Map<string, number>();
  for (const m of tf.values()) for (const w of m.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  vectors = new Map();
  for (const [id, m] of tf) {
    const v = new Map<string, number>();
    let norm = 0;
    for (const [w, n] of m) {
      const x = (1 + Math.log(n)) * Math.log(posts.length / df.get(w)!);
      v.set(w, x);
      norm += x * x;
    }
    norm = Math.sqrt(norm) || 1;
    for (const [w, x] of v) v.set(w, x / norm);
    vectors.set(id, v);
  }
}

export function related(post: Post, posts: Post[], n = 3): Post[] {
  if (!vectors) build(posts);
  const a = vectors!.get(post.id)!;
  return posts
    .filter((p) => p.id !== post.id)
    .map((p) => {
      let dot = 0;
      for (const [w, x] of vectors!.get(p.id)!) dot += x * (a.get(w) ?? 0);
      return { p, dot };
    })
    .sort((x, y) => y.dot - x.dot)
    .slice(0, n)
    .map((x) => x.p);
}
