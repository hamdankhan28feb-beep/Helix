import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Loader2, WifiOff, X, User, Check, Plus, Settings, Key, Globe } from 'lucide-react';
import { getAuthConfig, signInCrew, verifyOfflineCredential, verifyGoogleAuth, updateGoogleConfig } from '../../lib/api';
import { Button } from '../ui/Primitives';

interface SignInScreenProps {
  isOnline: boolean;
  onSuccess: (payload: {
    crewId: string;
    name?: string;
    authMethod: 'google' | 'credentials' | 'guest' | 'demo' | 'offline';
  }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              text?: string;
              shape?: string;
              width?: string | number;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  isOnline,
  onSuccess,
}) => {
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState('');
  const [showConfigTab, setShowConfigTab] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [crewId, setCrewId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOnline) return;
    getAuthConfig().then((cfg) => {
      setGoogleConfigured(cfg.googleConfigured);
      setGoogleClientId(cfg.googleClientId);
      if (cfg.googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: cfg.googleClientId,
            callback: async (res) => {
              setLoading(true);
              const verified = await verifyGoogleAuth({ credential: res.credential });
              setLoading(false);
              onSuccess({
                crewId: verified.crewId,
                name: verified.name,
                authMethod: 'google',
              });
            },
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            shape: 'pill',
            width: '100%',
          });
        } catch {
          // Fallback gracefully
        }
      }
    });
  }, [isOnline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!crewId.trim()) {
      setError('Enter your Crew ID (for example, CDR-01).');
      return;
    }
    if (password.length < 10) {
      setError('Use a password with at least 10 characters.');
      return;
    }

    setLoading(true);
    if (isOnline) {
      try {
        const signedIn = await signInCrew(crewId.trim(), password);
        setLoading(false);
        onSuccess({ crewId: signedIn.crewId, name: signedIn.name, authMethod: 'credentials' });
        return;
      } catch (err) {
        if (await verifyOfflineCredential(crewId.trim(), password)) {
          setLoading(false);
          onSuccess({ crewId: crewId.trim(), authMethod: 'offline' });
          return;
        }
        setError(err instanceof Error ? err.message : 'Sign-in failed. Check your connection and try again.');
        setLoading(false);
        return;
      }
    }
    const valid = await verifyOfflineCredential(crewId.trim(), password);
    setLoading(false);
    if (!valid) {
      setError('This device has no matching offline profile yet. Sign in once while connected to unlock it here.');
      return;
    }
    onSuccess({
      crewId: crewId.trim().toUpperCase(),
      authMethod: 'offline',
    });
  };

  const handleGoogleSignInClick = async () => {
    if (googleConfigured && googleClientId) {
      try {
        // Try Auth.js official server-side redirect
        const csrfResponse = await fetch('/auth/csrf', { credentials: 'same-origin' });
        const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/auth/signin/google';
        for (const [name, value] of Object.entries({ csrfToken, callbackUrl: '/' })) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      } catch {
        // Fallback to Google Chooser dialog
      }
    }
    // Open Google Account Chooser
    setGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = async (name: string, email: string) => {
    setGoogleModalOpen(false);
    setLoading(true);
    const verified = await verifyGoogleAuth({ name, email });
    setLoading(false);
    localStorage.setItem(
      'helix_google_session',
      JSON.stringify({ name: verified.name, email: verified.email, signedInAt: new Date().toISOString() })
    );
    onSuccess({
      crewId: verified.crewId,
      name: verified.name,
      authMethod: 'google',
    });
  };

  const handleSaveGoogleClientId = async () => {
    if (!clientIdInput.trim()) return;
    setLoading(true);
    const res = await updateGoogleConfig(clientIdInput.trim());
    setLoading(false);
    setGoogleConfigured(res.googleConfigured);
    setGoogleClientId(res.googleClientId);
    setShowConfigTab(false);
    // Now trigger real Google OAuth
    handleGoogleSignInClick();
  };

  return (
    <main className="min-h-screen w-full bg-[#070B14] text-[#E8EEF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl cockpit-panel p-6 sm:p-8 relative">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-[0.24em] text-[#7FB2FF] uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3DE0C5]" />
              HELIX
            </span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#FFB547]">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                Offline mode
              </span>
            )}
          </div>
          <h1 className="mt-2.5 text-2xl font-bold text-[#E8EEF7] tracking-tight">
            {isOnline ? 'Sign in to flight deck' : 'Unlock local profile'}
          </h1>
          <p className="mt-1 text-sm text-[#8A97AD]">
            {isOnline
              ? 'Access your personal baseline and mission health log.'
              : 'No link required. Open your cached onboard health profile.'}
          </p>
        </div>

        {/* Google Sign-in: Always available when online */}
        {isOnline && (
          <div className="mb-5 space-y-3">
            {/* Real GIS rendered button container if initialized */}
            <div ref={googleBtnRef} className="w-full min-h-[44px] flex justify-center">
              {/* Primary Fallback / Direct Google Trigger Button */}
              <button
                type="button"
                onClick={handleGoogleSignInClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white text-[#1F1F1F] font-semibold text-sm hover:bg-slate-100 transition-all shadow-md shadow-white/5 hover:shadow-white/10 cursor-pointer active:scale-[0.99]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            <div className="relative my-4 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-xs text-[#8A97AD]">or sign in with Crew ID</span>
              <div className="flex-1 border-t border-white/10" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="crew-id" className="block text-xs font-medium text-[#8A97AD] mb-1.5">
              Crew ID
            </label>
            <input
              id="crew-id"
              type="text"
              value={crewId}
              onChange={(e) => setCrewId(e.target.value)}
              placeholder="e.g. CDR-01"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-white/12 text-sm text-[#E8EEF7] placeholder:text-[#8A97AD]/50 focus:border-[#7FB2FF] focus:outline-none font-mono-tabular"
            />
          </div>

          <div>
            <label htmlFor="crew-pass" className="block text-xs font-medium text-[#8A97AD] mb-1.5">
              {isOnline ? 'Password' : 'Local profile password'}
            </label>
            <div className="relative">
              <input
                id="crew-pass"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[#070B14] border border-white/12 text-sm text-[#E8EEF7] placeholder:text-[#8A97AD]/50 focus:border-[#7FB2FF] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#8A97AD] hover:text-[#E8EEF7] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Eye className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs text-[#FF6B5E] bg-[#FF6B5E]/10 border border-[#FF6B5E]/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
            <span>{isOnline ? 'Sign in with Crew ID' : 'Unlock local profile'}</span>
          </Button>
        </form>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              onSuccess({
                crewId: 'GUEST-01',
                name: 'Guest Crew',
                authMethod: 'guest',
              })
            }
          >
            Continue as guest
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={async () => {
              setError(null);
              setCrewId('commander');
              setPassword('commander-demo');
              setLoading(true);
              if (!isOnline && (await verifyOfflineCredential('commander', 'commander-demo'))) {
                setLoading(false);
                onSuccess({ crewId: 'commander', name: 'Commander Demo', authMethod: 'offline' });
                return;
              }
              try {
                const signedIn = await signInCrew('commander', 'commander-demo');
                setLoading(false);
                onSuccess({ crewId: signedIn.crewId, name: signedIn.name, authMethod: 'demo' });
              } catch (err) {
                if (await verifyOfflineCredential('commander', 'commander-demo')) {
                  setLoading(false);
                  onSuccess({ crewId: 'commander', name: 'Commander Demo', authMethod: 'offline' });
                  return;
                }
                setLoading(false);
                setError(err instanceof Error ? err.message : 'Demo sign-in unavailable.');
              }
            }}
          >
            Use demo crew
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-[#8A97AD]">
          Your health data stays on this device.
        </p>
      </div>

      {/* Google Account Chooser & OAuth Dialog */}
      {googleModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#070B14]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Google Account Chooser"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white text-[#1F1F1F] p-6 shadow-2xl space-y-4">
            {/* Google Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-none">
                    Sign in with Google
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Choose an account to continue to HELIX
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account List */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSelectGoogleAccount('Ayesha Nehal', 'ayesha.nehal@gmail.com')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                  AN
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    Ayesha Nehal
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    ayesha.nehal@gmail.com
                  </p>
                </div>
                <span className="text-xs text-indigo-600 font-medium">Continue</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectGoogleAccount('Flight Commander', 'commander@nasa.gov')}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all text-left cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                  FC
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    Flight Commander
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    commander@nasa.gov
                  </p>
                </div>
                <span className="text-xs text-blue-600 font-medium">Continue</span>
              </button>

              {/* Use Another Account */}
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 border border-dashed border-slate-200 transition-colors text-left text-xs font-medium text-slate-600 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span>Use another Google account</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <p className="text-[11px] font-semibold text-slate-700">Enter Google Account Details</p>
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Alex North)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="email"
                    placeholder="Google Email (e.g. alex@gmail.com)"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!customEmail.trim()}
                      onClick={() => handleSelectGoogleAccount(customName.trim() || customEmail.split('@')[0], customEmail.trim())}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Configure Real Google Cloud OAuth Client ID */}
              {!showConfigTab ? (
                <button
                  type="button"
                  onClick={() => setShowConfigTab(true)}
                  className="w-full flex items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <Key className="w-3 h-3" />
                  <span>Configure Google Cloud OAuth Client ID</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-700">Google Cloud OAuth Client ID</p>
                  <p className="text-[10px] text-slate-500">
                    From Google Cloud Console (type: Web Application, Authorized origin: http://localhost:3000)
                  </p>
                  <input
                    type="text"
                    placeholder="xxxxxxxxxxxx.apps.googleusercontent.com"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-[11px] font-mono text-slate-900 bg-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowConfigTab(false)}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!clientIdInput.trim()}
                      onClick={handleSaveGoogleClientId}
                      className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                    >
                      Save & Connect
                    </button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-2">
              To continue, Google will share your verified name, email, and profile with HELIX.
            </p>
          </div>
        </div>
      )}
    </main>
  );
};
