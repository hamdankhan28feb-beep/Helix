import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, WifiOff } from 'lucide-react';
import { getAuthConfig, signInCrew, verifyOfflineCredential } from '../../lib/api';
import { Button } from '../ui/Primitives';

interface SignInScreenProps {
  isOnline: boolean;
  onSuccess: (payload: {
    crewId: string;
    name?: string;
    authMethod: 'google' | 'credentials' | 'guest' | 'demo' | 'offline';
  }) => void;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  isOnline,
  onSuccess,
}) => {
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [crewId, setCrewId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOnline) return;
    getAuthConfig().then((cfg) => setGoogleConfigured(cfg.googleConfigured));
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
        // Previously authenticated users can still unlock their locally cached profile.
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
    {
      setLoading(false);
      onSuccess({
        crewId: crewId.trim().toUpperCase(),
        authMethod: 'offline',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const csrfResponse = await fetch('/auth/csrf', { credentials: 'same-origin' });
      const { csrfToken } = await csrfResponse.json() as { csrfToken: string };
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/auth/signin/google';
      for (const [name, value] of Object.entries({ csrfToken, callbackUrl: '/' })) {
        const input = document.createElement('input');
        input.type = 'hidden'; input.name = name; input.value = value; form.appendChild(input);
      }
      document.body.appendChild(form); form.submit();
    } catch {
      setError('Google sign-in is unavailable. Use your Crew ID or demo crew.');
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#070B14] text-[#E8EEF7] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl cockpit-panel p-6 sm:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-[0.18em] text-[#7FB2FF] uppercase">
              HELIX
            </span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#FFB547]">
                <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
                Offline mode
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-[#E8EEF7] tracking-tight">
            {isOnline ? 'Sign in to flight deck' : 'Unlock local profile'}
          </h1>
          <p className="mt-1 text-sm text-[#8A97AD]">
            {isOnline
              ? 'Access your personal baseline and mission health log.'
              : 'No link required. Open your cached onboard health profile.'}
          </p>
        </div>

        {/* Google Auth button: only rendered when Google OAuth is configured */}
        {isOnline && googleConfigured && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white text-[#1F1F1F] font-medium text-sm hover:bg-slate-100 transition-colors cursor-pointer"
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

            <div className="relative my-5 flex items-center">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-xs text-[#8A97AD]">or</span>
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

          {
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
          }

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
            <span>{isOnline ? 'Sign in' : 'Unlock local profile'}</span>
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
              setError(null); setCrewId('commander'); setPassword('commander-demo'); setLoading(true);
              if (!isOnline && await verifyOfflineCredential('commander', 'commander-demo')) {
                setLoading(false); onSuccess({ crewId: 'commander', name: 'Commander Demo', authMethod: 'offline' }); return;
              }
              try {
                const signedIn = await signInCrew('commander', 'commander-demo');
                setLoading(false); onSuccess({ crewId: signedIn.crewId, name: signedIn.name, authMethod: 'demo' });
              } catch (err) {
                if (await verifyOfflineCredential('commander', 'commander-demo')) {
                  setLoading(false); onSuccess({ crewId: 'commander', name: 'Commander Demo', authMethod: 'offline' }); return;
                }
                setLoading(false); setError(err instanceof Error ? err.message : 'Demo sign-in unavailable.');
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
    </main>
  );
};
