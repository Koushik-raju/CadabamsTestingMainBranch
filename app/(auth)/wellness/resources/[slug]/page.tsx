'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  User,
  MapPin,
  Briefcase,
  ChevronRight,
  RefreshCw,
  Headphones,
  Play,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/shared/navigation/back-button';
import { AudioPlayer } from '@/components/wellness/audio-player';
import { VideoPlayer } from '@/components/wellness/video-player';
import { useWellnessResourceDetail } from '@/hooks/use-wellness-resource-detail';
import { getStrapiImageUrl } from '@/lib/strapi-fetcher';
import type { WellnessResource, ResourceBlock } from '@/types/wellness';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCategory(cat: string): string {
  return cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Rich text renderer ───────────────────────────────────────────────────────

function StrapiRichText({ nodes }: { nodes: unknown[] }) {
  if (!Array.isArray(nodes)) return null;
  return (
    <>
      {nodes.map((node: unknown, i) => {
        const n = node as Record<string, unknown>;
        if (n.type === 'paragraph') {
          const children = (n.children as unknown[]) ?? [];
          const text = children
            .map((c) => {
              const ch = c as Record<string, unknown>;
              let t = String(ch.text ?? '');
              if (ch.bold) t = `<strong>${t}</strong>`;
              if (ch.italic) t = `<em>${t}</em>`;
              return t;
            })
            .join('');
          if (!text.trim()) return <br key={i} />;
          return (
            <p
              key={i}
              className="text-foreground leading-relaxed mb-3"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          );
        }
        if (n.type === 'heading') {
          const children = (n.children as unknown[]) ?? [];
          const text = children.map((c) => String((c as Record<string, unknown>).text ?? '')).join('');
          const level = Number(n.level ?? 2);
          const cls =
            level <= 2
              ? 'text-xl font-bold text-foreground mt-6 mb-2'
              : 'text-lg font-semibold text-foreground mt-4 mb-2';
          if (level <= 2) return <h2 key={i} className={cls}>{text}</h2>;
          if (level === 3) return <h3 key={i} className={cls}>{text}</h3>;
          return <h4 key={i} className={cls}>{text}</h4>;
        }
        if (n.type === 'list') {
          const items = (n.children as unknown[]) ?? [];
          const isOrdered = n.format === 'ordered';
          const Tag = isOrdered ? 'ol' : 'ul';
          return (
            <Tag
              key={i}
              className={`mb-3 pl-5 ${isOrdered ? 'list-decimal' : 'list-disc'} space-y-1`}
            >
              {items.map((item, j) => {
                const it = item as Record<string, unknown>;
                const itemChildren = (it.children as unknown[]) ?? [];
                const text = itemChildren
                  .map((c) => String((c as Record<string, unknown>).text ?? ''))
                  .join('');
                return (
                  <li key={j} className="text-foreground leading-relaxed">
                    {text}
                  </li>
                );
              })}
            </Tag>
          );
        }
        if (n.type === 'image') {
          const img = n.image as Record<string, unknown> | undefined;
          const url = getStrapiImageUrl(String(img?.url ?? ''));
          if (!url) return null;
          return (
            <div key={i} className="rounded-2xl overflow-hidden my-4">
              <Image
                src={url}
                alt={String(img?.alternativeText ?? '')}
                width={800}
                height={450}
                className="w-full object-cover"
              />
            </div>
          );
        }
        return null;
      })}
    </>
  );
}

function RichTextBlock({ block }: { block: ResourceBlock }) {
  if (block.__component === 'blocks.richtext') {
    const body = block.body ?? block.content ?? block.text;
    if (Array.isArray(body)) {
      return (
        <div className="space-y-1">
          <StrapiRichText nodes={body} />
        </div>
      );
    }
    if (typeof body === 'string' && body.trim()) {
      return (
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      );
    }
    return null;
  }
  if (block.__component === 'blocks.image') {
    const img = block.image as { url?: string; alternativeText?: string } | undefined;
    const url = getStrapiImageUrl(img?.url);
    if (!url) return null;
    return (
      <div className="rounded-2xl overflow-hidden">
        <Image
          src={url}
          alt={img?.alternativeText ?? (block.caption as string) ?? ''}
          width={800}
          height={450}
          className="w-full object-cover"
        />
      </div>
    );
  }
  return null;
}

// ─── Author card ──────────────────────────────────────────────────────────────

interface AuthorData {
  name?: string;
  experience?: number;
  location?: string[];
  department?: string[];
  linkForAppointment?: string;
}

function AuthorCard({ author }: { author: AuthorData }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-start">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <User className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-foreground text-sm">{author.name ?? 'Expert'}</p>
        {author.department && author.department.length > 0 && (
          <p className="text-muted-foreground text-xs mt-0.5">
            {author.department.map((d) => d.replace(/-/g, ' ')).join(' · ')}
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-2">
          {author.experience != null && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Briefcase className="h-3 w-3" />
              <span>{author.experience} yrs experience</span>
            </div>
          )}
          {author.location && author.location.length > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <MapPin className="h-3 w-3" />
              <span>{author.location.join(', ')}</span>
            </div>
          )}
        </div>
        {author.linkForAppointment && (
          <a
            href={author.linkForAppointment}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
          >
            Book appointment <ChevronRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Similar article card ─────────────────────────────────────────────────────

function SimilarCard({ blog, onClick }: { blog: WellnessResource; onClick: () => void }) {
  const imgUrl =
    getStrapiImageUrl(blog.coverImage?.webImage?.url ?? blog.coverImage?.mobileImage?.url) ?? null;
  const cats = Array.isArray(blog.category)
    ? (blog.category as string[])
    : blog.category
    ? [blog.category as string]
    : [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all duration-200 flex gap-3"
    >
      {imgUrl && (
        <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden bg-muted">
          <Image src={imgUrl} alt={blog.title ?? ''} fill className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center gap-1">
        {cats.length > 0 && (
          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
            {formatCategory(cats[0])}
          </span>
        )}
        <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
          {blog.title}
        </p>
      </div>
      <div className="pr-3 flex items-center">
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { resource, isLoading, error } = useWellnessResourceDetail(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <BackButton fallback="/wellness/resources" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: '16/9' }} />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? 'w-3/4' : 'w-full'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center gap-4">
        <RefreshCw className="h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">{error?.message ?? 'Article not found'}</p>
        <Button asChild variant="outline">
          <Link href="/wellness/resources">Back to Resources</Link>
        </Button>
      </div>
    );
  }

  const categories = Array.isArray(resource.category)
    ? (resource.category as string[])
    : resource.category
    ? [resource.category as string]
    : [];

  const coverWebUrl = getStrapiImageUrl(resource.coverImage?.webImage?.url);
  const coverMobileUrl = getStrapiImageUrl(resource.coverImage?.mobileImage?.url);
  const hasCover = !!(coverWebUrl || coverMobileUrl);

  const author = resource.author as AuthorData | undefined;
  const readTime = (resource as WellnessResource & { averageReadTime?: string }).averageReadTime;
  const publishedOn = (resource as WellnessResource & { publishedOn?: string }).publishedOn;

  const hasTextBlocks = Array.isArray(resource.text) && resource.text.length > 0;
  const similarBlogs = (resource.similarBlogs ?? []) as WellnessResource[];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <BackButton fallback="/wellness/resources" />
        <h1 className="text-primary font-bold text-base truncate flex-1">Resources</h1>
      </div>

      <article className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 pb-20 space-y-6">
        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="rounded-full text-xs font-bold">
                {formatCategory(cat)}
              </Badge>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {resource.title}
        </h1>

        {/* Meta row */}
        {(readTime || publishedOn) && (
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            {readTime && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{readTime}</span>
              </div>
            )}
            {publishedOn && (
              <span>
                {new Date(publishedOn).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        )}

        {/* Subtitle as pull quote */}
        {resource.subTitle && (
          <p className="text-muted-foreground text-base leading-relaxed border-l-4 border-primary/40 pl-4 italic">
            {resource.subTitle}
          </p>
        )}

        {/* Cover image */}
        {hasCover && (
          <div className="rounded-2xl overflow-hidden shadow-sm">
            {coverMobileUrl && (
              <div className="relative w-full aspect-video md:hidden">
                <Image
                  src={coverMobileUrl}
                  alt={resource.coverImage?.mobileImage?.alternativeText ?? resource.title ?? ''}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            <div
              className={`relative w-full aspect-video ${coverMobileUrl ? 'hidden md:block' : 'block'}`}
            >
              {coverWebUrl && (
                <Image
                  src={coverWebUrl}
                  alt={resource.coverImage?.webImage?.alternativeText ?? resource.title ?? ''}
                  fill
                  className="object-cover"
                  priority
                />
              )}
            </div>
          </div>
        )}

        {/* Audio player */}
        {resource.audioUrl && (
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Listen to Article</span>
            </div>
            <AudioPlayer src={resource.audioUrl} title={resource.title ?? 'Audio'} />
          </div>
        )}

        {/* Video player */}
        {resource.videoUrl && (
          <div className="rounded-2xl overflow-hidden bg-black">
            <div className="flex items-center gap-2 p-3 bg-black/80">
              <Play className="h-4 w-4 text-white/70" />
              <span className="font-semibold text-sm text-white/70">Watch Video</span>
            </div>
            <VideoPlayer src={resource.videoUrl} title={resource.title ?? 'Video'} />
          </div>
        )}

        {/* Article body */}
        {hasTextBlocks ? (
          <div className="space-y-1">
            {(resource.text as ResourceBlock[]).map((block, i) => (
              <RichTextBlock key={block.id ?? i} block={block} />
            ))}
          </div>
        ) : resource.description ? (
          <p className="text-foreground leading-relaxed">{resource.description}</p>
        ) : null}

        {/* Author */}
        {author?.name && (
          <div className="space-y-3 pt-2 border-t border-border">
            <h2 className="text-base font-bold text-foreground pt-4">About the Author</h2>
            <AuthorCard author={author} />
          </div>
        )}

        {/* Similar articles */}
        {similarBlogs.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-bold text-foreground">Related Articles</h2>
              <Button variant="link" asChild className="text-primary p-0 h-auto text-sm">
                <Link href="/wellness/resources">
                  See All <ChevronRight className="h-4 w-4 ml-0.5" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {similarBlogs.slice(0, 5).map((blog, i) => (
                <SimilarCard
                  key={blog.id ?? i}
                  blog={blog}
                  onClick={() => router.push(`/wellness/resources/${blog.slug}`)}
                />
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
