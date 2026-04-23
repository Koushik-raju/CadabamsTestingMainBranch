export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ paddingTop: "var(--safe-area-inset-top)" }}
    >
      {children}
    </div>
  );
}
