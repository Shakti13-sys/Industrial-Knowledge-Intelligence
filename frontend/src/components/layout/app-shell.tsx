import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/shared/command-palette';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 grid-fade opacity-60" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="relative flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
