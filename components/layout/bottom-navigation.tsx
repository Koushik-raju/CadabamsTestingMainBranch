'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigationMenuItems, type NavItem } from '@/config/navigation';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border"
      style={{ paddingBottom: 'var(--safe-area-inset-bottom)' }}>
      <ul className="flex items-center justify-around h-16">
        {navigationMenuItems.map((item: NavItem) => {
          const active = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <li key={item.key}>
              <Link href={item.path}
                className={cn('flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground')}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
