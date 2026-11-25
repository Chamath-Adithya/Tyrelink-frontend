import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Server,
  Database,
  LayoutDashboard,
  Edit3,
  LogOut,
} from 'lucide-react';
import { clearAdminSession, getAdminSession, saveAdminSession } from '../../utils/adminStore';
import { loginAdmin, logoutAdmin, verifyAdminSession } from '../../services/authService';

export default function AdminGatewayForm() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [backendStatus, setBackendStatus] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<string | null>(null);

  useEffect(() => {
    const sess = getAdminSession();
    if (!sess) return;
    verifyAdminSession().then((ok) => {
      if (ok) {
        setActiveUser(sess.username || 'admin');
      } else {
        clearAdminSession();
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both Admin Username and Security Key');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginAdmin(password.trim());

      if (res.success) {
        setSuccess(true);
        setBackendStatus(res.isBackendConnected ? 'Go API Backend (Online)' : 'Local Storage Mode');

        saveAdminSession({
          username: username.trim(),
          loginTime: Date.now(),
          editMode: true,
        });

        setTimeout(() => {
          window.location.href = '/merchant';
        }, 700);
      } else {
        setError(res.error || 'Access Denied: Invalid credentials');
      }
    } catch (err: any) {
      setError('Authentication error: ' + (err?.message || 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logoutAdmin();
    clearAdminSession();
    setActiveUser(null);
  };

  if (activeUser) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-8 space-y-6 text-left text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black font-display">Session Active ({activeUser})</h1>
              <p className="text-xs text-slate-400 font-mono">Authenticated against Tyrelink Go API</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <a
              href="/merchant"
              className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg transition-all"
            >
              <span className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Open Store Command Center</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="/?admin_mode=active"
              className="flex items-center justify-between p-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-sm transition-all"
            >
              <span className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Open Storefront Live Edit Mode</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of Admin Session</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-8 sm:p-10 overflow-hidden text-left">
        <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 p-0.5 shadow-lg shadow-brand-500/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-brand-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white font-display tracking-tight">
              Merchant Gateway
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Tyrelink Central Store Control Terminal
            </p>
          </div>
        </div>

        {error && (
          <div className="relative z-10 mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="relative z-10 mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1 text-emerald-400 text-xs">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Authorized! Opening Store Console...</span>
            </div>
            {backendStatus && (
              <span className="text-[11px] text-emerald-300 font-mono pl-6">
                Connected: {backendStatus}
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                autoComplete="username"
                required
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Security Key (Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
                className="w-full h-12 pl-11 pr-11 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-red-600 hover:from-brand-500 hover:to-red-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Authenticate & Open Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>HMAC + Brute-Force Guard</span>
          </span>
          <span className="font-mono text-slate-400 flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Postgres + Redis</span>
          </span>
        </div>
      </div>

      <div className="mt-5 text-center text-[11px] text-slate-500 font-mono">
        Authenticated via server <span className="text-slate-300">TYRELINK_ADMIN_PASSWORD</span>
      </div>
    </div>
  );
}
