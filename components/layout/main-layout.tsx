"use client";

import { BottomNavigation } from "./bottom-navigation";

interface MainLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export function MainLayout({ children, hideNav = false }: MainLayoutProps) {
  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ paddingTop: "var(--safe-area-inset-top)" }}
    >
      <main className={`flex-1 overflow-y-auto ${hideNav ? "" : "pb-20"}`}>{children}</main>
      {!hideNav && <BottomNavigation />}
    </div>
  );
}
