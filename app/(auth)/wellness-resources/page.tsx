'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/common/back-button';
import { CategoryFilter } from '@/components/wellness/category-filter';
import { ResourceGrid } from '@/components/wellness/resource-grid';
import { Skeleton } from '@/components/ui/skeleton';
import type { WellnessResource } from '@/types/wellness';

const STRAPI_URL = 'https://mindtalkbuddy.com/api';

export default function WellnessResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<WellnessResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${STRAPI_URL}/pages/?filters[slug][$eq][0]=blogs&pLevel=5`
        );
        const json = await res.json();
        const block = json?.data?.[0]?.blocks?.find(
          (b: { __component: string }) => b.__component === 'blocks.blogs-list'
        );
        const blogs: WellnessResource[] = block?.blogs ?? [];
        setResources(blogs);

        const catSet = new Set<string>(['All']);
        blogs.forEach((b) => {
          const cats = Array.isArray(b.category) ? b.category : b.category ? [b.category] : [];
          cats.forEach((c: string) => catSet.add(c));
        });
        setCategories(Array.from(catSet));
      } catch (err) {
        console.error('Failed to fetch wellness resources:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResources();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const cats = Array.isArray(r.category) ? r.category : r.category ? [r.category] : [];
      const matchesCategory = selectedCategory === 'All' || cats.includes(selectedCategory);
      const matchesSearch =
        !searchTerm ||
        (r.title ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [resources, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="relative bg-primary/10 pt-safe-top">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-transparent" />
        <div className="relative z-10 px-4 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <BackButton fallback="/home" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Our Resources</h1>
              <p className="text-sm text-muted-foreground">{resources.length} Articles</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${resources.length} resources…`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-full bg-background/90 backdrop-blur"
              aria-label="Search wellness resources"
            />
          </div>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="px-4 pt-4">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        {/* Section heading */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Featured Resources</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-border">
                <Skeleton className="h-[200px] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-20 rounded-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ResourceGrid
            resources={filteredResources}
            onSelect={(r) => router.push(`/wellness-resources/${r.slug}`)}
          />
        )}
      </main>
    </div>
  );
}
