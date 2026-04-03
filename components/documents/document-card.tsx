'use client';

import { File, Calendar, Download, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface DocumentData {
  id: string;
  name: string;
  path?: string;
  size?: number;
  type?: string;
  url: string;
  createdAt?: string;
}

interface DocumentCardProps {
  doc: DocumentData;
  index: number;
  onDownload: (doc: DocumentData) => void;
  onDelete: (doc: DocumentData) => void;
  downloading?: boolean;
  deleting?: boolean;
}

function formatSize(size?: number): string {
  if (!size) return '';
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function formatDate(isoStr?: string): string {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function DocumentCard({
  doc,
  index,
  onDownload,
  onDelete,
  downloading,
  deleting,
}: DocumentCardProps) {
  const displayName = doc.name || `Document #${index + 1}`;

  return (
    <Card
      className="shadow-sm hover:shadow-md transition-shadow"
      role="listitem"
      aria-label={`Document ${index + 1}: ${displayName}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* File icon */}
          <div
            className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <File className="w-6 h-6 text-primary" />
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-foreground text-sm truncate"
              title={displayName}
            >
              {displayName}
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
              {doc.size !== undefined && doc.size > 0 && (
                <span className="text-xs text-muted-foreground">{formatSize(doc.size)}</span>
              )}
              {doc.createdAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {formatDate(doc.createdAt)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => onDownload(doc)}
              disabled={downloading}
              aria-label={`Download ${displayName}`}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(doc)}
              disabled={deleting}
              aria-label={`Delete ${displayName}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
