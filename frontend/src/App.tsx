import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ActivityProvider } from '@/lib/activity-context';
import { DataProvider } from '@/lib/data-context';
import DashboardPage from '@/pages/dashboard';
import DocumentsPage from '@/pages/documents';
import ChatPage from '@/pages/chat';
import EntitiesPage from '@/pages/entities';
import KnowledgePage from '@/pages/knowledge';
import SettingsPage from '@/pages/settings';
import SupportPage from '@/pages/support';
import LoginPage from '@/pages/login';

function ProtectedArea({ children }: { children: React.ReactNode }) {
  const { username, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-copper" />
      </div>
    );
  }
  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthedApp() {
  return (
    <ProtectedArea>
      <DataProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/entities" element={<EntitiesPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </AppShell>
      </DataProvider>
    </ProtectedArea>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ActivityProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<AuthedApp />} />
          </Routes>
        </ActivityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
