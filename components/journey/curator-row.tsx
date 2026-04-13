'use client';

interface CuratorRowProps {
  name: string;
  role?: string;
  avatarUrl?: string;
}

export function CuratorRow({ name, role, avatarUrl }: CuratorRowProps) {
  if (!name) return null;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-foreground">Curated by {name}</p>
        {role && <p className="text-xs text-muted-foreground">{role}</p>}
      </div>
    </div>
  );
}
