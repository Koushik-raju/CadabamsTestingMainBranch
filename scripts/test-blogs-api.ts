import axios from 'axios';

const BASE = 'https://mindtalkbuddy.com/api';

async function get(path: string) {
  const url = `${BASE}${path}`;
  console.log(`\n🔍 GET ${url}`);
  const { data } = await axios.get(url);
  return data;
}

async function main() {
  // ── 1. Bare list — see top-level shape ──────────────────────────────────────
  console.log('\n═══ 1. Bare list (pLevel=2, page 1, size 3) ═══');
  const list1 = await get('/blogs?pLevel=2&pagination[pageSize]=3&pagination[page]=1');
  console.log('meta:', JSON.stringify(list1.meta, null, 2));
  console.log('data length:', list1.data?.length);
  if (list1.data?.[0]) {
    console.log('first item keys:', Object.keys(list1.data[0]));
    console.log('first item (trimmed):');
    const { text: _t, similarBlogs: _s, ...rest } = list1.data[0];
    console.log(JSON.stringify(rest, null, 2));
  }

  // ── 2. Page 2 ────────────────────────────────────────────────────────────────
  console.log('\n═══ 2. Page 2 ═══');
  const list2 = await get('/blogs?pLevel=2&pagination[pageSize]=3&pagination[page]=2');
  console.log('meta:', JSON.stringify(list2.meta, null, 2));
  console.log('data length:', list2.data?.length);
  console.log('first item slug:', list2.data?.[0]?.slug);

  // ── 3. Search by title ───────────────────────────────────────────────────────
  console.log('\n═══ 3. Search by title ($containsi) ═══');
  const search = await get('/blogs?pLevel=2&filters[title][$containsi]=anxiety');
  console.log('total results:', search.meta?.pagination?.total, '| data length:', search.data?.length);
  search.data?.slice(0, 3).forEach((b: any) => console.log(' -', b.slug, '|', b.title));

  // ── 4. Search by description ─────────────────────────────────────────────────
  console.log('\n═══ 4. Search by description ═══');
  const searchDesc = await get('/blogs?pLevel=2&filters[description][$containsi]=stress');
  console.log('total results:', searchDesc.meta?.pagination?.total);

  // ── 5. Filter by category ────────────────────────────────────────────────────
  console.log('\n═══ 5. Filter by category ═══');
  const byCat = await get('/blogs?pLevel=2&filters[category][$containsi]=anxiety');
  console.log('total results:', byCat.meta?.pagination?.total, '| data:', byCat.data?.length);

  // ── 6. Full detail — single blog by slug (deep) ──────────────────────────────
  const firstSlug = list1.data?.[0]?.slug;
  if (firstSlug) {
    console.log(`\n═══ 6. Full detail — slug=${firstSlug} (pLevel=5) ═══`);
    const detail = await get(`/blogs?filters[slug][$eq][0]=${firstSlug}&pLevel=5`);
    const item = detail.data?.[0];
    if (item) {
      console.log('All keys:', Object.keys(item));
      console.log('title:', item.title);
      console.log('subTitle:', item.subTitle);
      console.log('description:', item.description?.slice(0, 100));
      console.log('category:', item.category);
      console.log('audioUrl:', item.audioUrl);
      console.log('videoUrl:', item.videoUrl);
      console.log('coverImage:', JSON.stringify(item.coverImage, null, 2));
      console.log('text blocks count:', item.text?.length);
      if (item.text?.length) {
        console.log('text block components:', item.text.map((b: any) => b.__component));
        console.log('first text block:', JSON.stringify(item.text[0], null, 2).slice(0, 400));
      }
      console.log('similarBlogs count:', item.similarBlogs?.length);
    }
  }

  // ── 7. Combined search + pagination ─────────────────────────────────────────
  console.log('\n═══ 7. Search + pagination ═══');
  const combined = await get('/blogs?pLevel=2&pagination[pageSize]=5&pagination[page]=1&filters[title][$containsi]=mental');
  console.log('meta:', JSON.stringify(combined.meta?.pagination, null, 2));
  combined.data?.forEach((b: any) => console.log(' -', b.title?.slice(0, 60)));

  // ── 8. Sort options ──────────────────────────────────────────────────────────
  console.log('\n═══ 8. Sort by publishedAt desc ═══');
  const sorted = await get('/blogs?pLevel=2&pagination[pageSize]=3&sort=publishedAt:desc');
  sorted.data?.forEach((b: any) => console.log(' -', b.slug, b.publishedAt));

  console.log('\n✅ Done.');
}

main().catch((err) => {
  console.error('❌ Error:', err.response?.status, err.response?.data ?? err.message);
  process.exit(1);
});
