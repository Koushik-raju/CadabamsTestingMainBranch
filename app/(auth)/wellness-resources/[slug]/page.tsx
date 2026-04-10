'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/shared/navigation/back-button';
import { AudioPlayer } from '@/components/wellness/audio-player';
import { VideoPlayer } from '@/components/wellness/video-player';
import { ResourceCard } from '@/components/wellness/resource-card';
import type { WellnessResource } from '@/types/wellness';
import { ChevronRight } from 'lucide-react';

function getStrapiImageUrl(url?: string): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url.split('?')[0];
  return `https://admin.mindtalkbuddy.com${url}`.split('?')[0];
}

export default function WellnessResourceDetailPage() {
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [resource, setResource] = useState<WellnessResource | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetchResource = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `https://mindtalkbuddy.com/api/blogs/?filters[slug][$eq][0]=${slug}&pLevel=5`
        );
        if (!res.ok) throw new Error('Failed to fetch resource');
        const { data } = await res.json();
        if (data && data.length > 0) {
          setResource(data[0] as WellnessResource);
        } else {
          setError('Resource not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load resource. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchResource();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <BackButton fallback="/wellness-resources" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-muted-foreground">{error ?? 'Resource not found'}</p>
        <Button asChild variant="outline">
          <Link href="/wellness-resources">Back to Resources</Link>
        </Button>
      </div>
    );
  }

  const categories = Array.isArray(resource.category)
    ? resource.category
    : resource.category
    ? [resource.category]
    : [];

  const webImageUrl = getStrapiImageUrl(resource.coverImage?.webImage?.url);
  const mobileImageUrl = getStrapiImageUrl(resource.coverImage?.mobileImage?.url);

  const similarBlogs = (resource.similarBlogs ?? []) as WellnessResource[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton fallback="/wellness-resources" />
        <h1 className="text-primary font-bold text-base truncate">Resources</h1>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 max-w-3xl mx-auto w-full">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {resource.title}
        </h1>

        {/* Subtitle */}
        {resource.subTitle && (
          <p className="text-muted-foreground text-base leading-relaxed">{resource.subTitle}</p>
        )}

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="rounded-full text-xs font-bold">
                {cat}
              </Badge>
            ))}
          </div>
        )}

        {/* Cover image */}
        {(webImageUrl || mobileImageUrl) && (
          <div className="rounded-2xl overflow-hidden">
            {mobileImageUrl && (
              <div className="relative w-full aspect-video md:hidden">
                <Image
                  src={mobileImageUrl}
                  alt={resource.coverImage?.mobileImage?.alternativeText ?? resource.title ?? 'Resource'}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            {webImageUrl && (
              <div className="relative w-full aspect-video hidden md:block">
                <Image
                  src={webImageUrl}
                  alt={resource.coverImage?.webImage?.alternativeText ?? resource.title ?? 'Resource'}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
          </div>
        )}

        {/* Audio player (if audio URL present) */}
        {resource.audioUrl && (
          <AudioPlayer
            src={resource.audioUrl}
            title={resource.title ?? 'Audio'}
          />
        )}

        {/* Video player (if video URL present) */}
        {resource.videoUrl && (
          <VideoPlayer
            src={resource.videoUrl}
            title={resource.title ?? 'Video'}
          />
        )}

        {/* Description / body */}
        {resource.description && (
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="text-muted-foreground leading-relaxed">{resource.description}</p>
          </div>
        )}

        {/* Similar resources */}
        {similarBlogs.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Similar Posts</h2>
              <Button variant="link" asChild className="text-primary p-0">
                <Link href="/wellness-resources">
                  See All <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {similarBlogs.slice(0, 4).map((blog, i) => (
                <ResourceCard
                  key={blog.id ?? i}
                  resource={blog}
                  index={i}
                  onClick={() => window.location.assign(`/wellness-resources/${blog.slug}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
