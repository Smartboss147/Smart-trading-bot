import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authenticateWithGoogle, getFriendlyFirebaseErrorMessage, isFirebaseConfigured } from '../lib/firebase';
import { Shield, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { safeFetchJson } from '../utils/api';

interface AuthProps {
  onSuccess?: (sessionData?: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setMessage('Verification link sent. Please verify your email to access the trading terminal.');
        } else {
          setMessage('Account created successfully!');
          onSuccess?.(data.session);
        }
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        onSuccess?.(data.session);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (!isFirebaseConfigured) {
        setError(
          'Firebase Google Authentication is not configured. Please set the VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID environment variables.'
        );
        setGoogleLoading(false);
        return;
      }

      // 1. Authenticate with real Firebase Google flow
      const googleResult = await authenticateWithGoogle();
      const { email: googleEmail, idToken, user: firebaseUser, displayName } = googleResult;

      // 2. Send verified Google identity to backend bridge
      const backendRes = await safeFetchJson('/api/auth/firebase-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          firebaseUid: firebaseUser.uid,
          displayName: displayName || firebaseUser.displayName,
          idToken
        })
      });

      if (!backendRes.ok || !backendRes.data?.ok) {
        throw new Error(backendRes.error || backendRes.data?.error || 'Failed to synchronize account identity.');
      }

      const { tokenHash, user: appUser } = backendRes.data;

      // 3. Connect identity to Supabase application session
      if (tokenHash && isSupabaseConfigured) {
        let otpVerified = false;
        try {
          const { data: otpData, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'magiclink'
          });
          if (!otpError && otpData?.session) {
            otpVerified = true;
            onSuccess?.(otpData.session);
          }
        } catch (otpErr) {
          console.warn('[Auth] magiclink OTP verify attempt warning, trying email type:', otpErr);
        }

        if (!otpVerified) {
          try {
            const { data: otpDataEmail, error: otpErrorEmail } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'email'
            });
            if (!otpErrorEmail && otpDataEmail?.session) {
              otpVerified = true;
              onSuccess?.(otpDataEmail.session);
            }
          } catch (e) {
            console.warn('[Auth] email OTP verify attempt warning:', e);
          }
        }
      }

      // If in offline/local mock mode or already verified
      onSuccess?.({ user: appUser, access_token: idToken });
    } catch (err: any) {
      console.error('[Auth] Google authentication error:', err);
      const friendlyMsg = getFriendlyFirebaseErrorMessage(err);
      setError(friendlyMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center mx-auto text-cyan-400">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">ApexQuant Terminal</h1>
          <p className="text-sm text-slate-400">
            {isSignUp ? 'Create your quant trading account' : 'Sign in to access your trading algorithms'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-950/60 border border-rose-800 p-3.5 rounded-lg text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-950/60 border border-emerald-800 p-3.5 rounded-lg text-xs text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{message}</span>
          </div>
        )}

        {/* Real Firebase Google Sign-In Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading || googleLoading}
            id="google-signin-button"
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 border border-slate-700 hover:border-slate-600 disabled:opacity-50 text-slate-100 font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-3 shadow-md group"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              or continue with email
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        </div>

        {/* Existing Email & Password Login / Signup */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                disabled={loading || googleLoading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trader@apexquant.io"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                disabled={loading || googleLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-950"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-1 text-center text-xs text-slate-400">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={() => { setIsSignUp(false); setError(null); setMessage(null); }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Need an account?{' '}
              <button
                type="button"
                disabled={loading || googleLoading}
                onClick={() => { setIsSignUp(true); setError(null); setMessage(null); }}
                className="text-cyan-400 hover:underline font-semibold"
              >
                Sign Up
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
