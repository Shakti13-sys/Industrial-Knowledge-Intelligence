import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Factory, Lock, User, ArrowRight, Cpu, Search, FileCheck2, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useActivity } from '@/lib/activity-context';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register } = useAuth();
  const { logEvent } = useActivity();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await register(username, password);
        logEvent({
          type: 'login',
          title: 'Account created',
          description: `${username} registered and started a session`,
        });
      } else {
        await login(username, password);
        logEvent({
          type: 'login',
          title: 'Signed in',
          description: `${username} started a new session`,
        });
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-surface border-r border-border">
        <div className="absolute inset-0 grid-fade opacity-40" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-copper/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-copper/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-copper/15 border border-copper/30 text-copper">
            <Factory className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground">IKIP</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Industrial Knowledge Intelligence</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl font-semibold leading-tight text-foreground max-w-md">
            Ground every decision in your industrial knowledge.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-sm text-muted max-w-md leading-relaxed">
            IKIP unifies maintenance reports, OEM manuals, and incident records into a single grounded AI — with source citations, a visible reasoning trace, and honest confidence scoring.
          </motion.p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[
              { icon: Cpu, label: 'Inference', value: 'Groq' },
              { icon: Search, label: 'Retrieval', value: 'TF-IDF' },
              { icon: FileCheck2, label: 'Answers cited', value: '100%' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="rounded-lg border border-border bg-surface-2/60 p-3">
                <s.icon className="h-4 w-4 text-copper mb-2" strokeWidth={1.75} />
                <p className="text-base font-semibold text-foreground">{s.value}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[10px] text-muted-2">Built for ET AI Hackathon 2026 · Problem Statement #8</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-copper/15 border border-copper/30 text-copper"><Factory className="h-5 w-5" strokeWidth={1.75} /></div>
            <p className="text-sm font-semibold tracking-wide text-foreground">IKIP</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isRegistering ? 'Create an employee account' : 'Sign in to your workspace'}
            </h2>
            <p className="text-sm text-muted mt-1">
              {isRegistering ? 'Register to access industrial intelligence.' : 'Access your industrial knowledge intelligence.'}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="pl-9" required autoComplete="username" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" required autoComplete="current-password" />
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="h-4 w-4 rounded-full border-2 border-background border-t-transparent" />
              ) : isRegistering ? (
                <UserPlus className="h-4 w-4" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? (isRegistering ? 'Registering…' : 'Signing in…') : isRegistering ? 'Create Account' : 'Sign in'}
            </Button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-xs font-medium text-copper hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign in' : "New team member? Register account"}
            </button>
          </div>

          <div className="rounded-lg border border-border bg-surface-2/60 px-4 py-3">
            <p className="font-mono text-[11px] text-muted">
              Demo credentials — <span className="text-foreground">demo</span> / <span className="text-foreground">ikip-demo</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}