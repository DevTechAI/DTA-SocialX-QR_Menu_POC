'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supabaseNotConfigured, setSupabaseNotConfigured] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSupabaseNotConfigured(true);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please set up your .env.local file with Supabase credentials.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Check if user is authorized
        const { data: authorizedEmail } = await supabase
          .from('authorized_emails')
          .select('role')
          .eq('email', email)
          .single();

        if (!authorizedEmail) {
          await supabase.auth.signOut();
          setError('Your email is not authorized to access the admin panel. Please contact the administrator.');
          return;
        }

        // Redirect to admin dashboard
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase is not configured. Please set up your .env.local file with Supabase credentials.');
      return;
    }

    setLoading(true);
    setError('');

    const redirectUrl = `${window.location.origin}/auth/callback?next=/admin`;
    console.log('🔐 Initiating Google OAuth sign-in...');
    console.log('📍 Current origin:', window.location.origin);
    console.log('📍 Redirect URL:', redirectUrl);

    try {
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (signInError) {
        // Check if it's a configuration error
        if (
          signInError.message.includes('provider is not enabled') ||
          signInError.message.includes('Unsupported provider') ||
          signInError.message.includes('400') ||
          signInError.message.includes('Bad Request')
        ) {
          setError('Google OAuth is not enabled in Supabase. Please enable it in Supabase Dashboard → Authentication → Providers → Google, or use email/password sign in.');
        } else {
          throw signInError;
        }
        setLoading(false);
      }
      // If successful, user will be redirected, so don't set loading to false
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google. Please use email/password sign in instead.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border-2 border-orange-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-900 mb-2">👔 Admin Sign In</h1>
          <p className="text-orange-600">SocialX Community Café</p>
        </div>

        {supabaseNotConfigured && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Supabase Not Configured</h3>
            <p className="text-yellow-800 text-sm mb-2">
              To use admin features, you need to set up Supabase:
            </p>
            <ol className="text-yellow-800 text-sm list-decimal list-inside space-y-1">
              <li>Create a <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in the project root</li>
              <li>Add your Supabase credentials (see <code className="bg-yellow-100 px-1 rounded">SUPABASE_CHECKLIST.md</code>)</li>
              <li>Restart the dev server</li>
            </ol>
            <p className="text-yellow-800 text-xs mt-2">
              The app will work with mock data for customer features, but admin features require Supabase.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="your-email@gmail.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-orange-900 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-orange-600">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-4 w-full py-3 border-2 border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign in with Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Only pre-authorized emails can access the admin panel.
        </p>
      </div>
    </div>
  );
}

