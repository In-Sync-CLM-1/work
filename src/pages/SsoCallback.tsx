import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// Landing point for RMPL's SSO handoff. Exchanges the signed code for a real
// local session — most visitors never consciously see this page, it's a
// brief redirect stop between "Continue with RMPL" and the dashboard.
export function SsoCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const code = searchParams.get('code');
      if (!code) {
        navigate('/auth', { replace: true });
        return;
      }

      const expectedState = sessionStorage.getItem('sso_state');
      sessionStorage.removeItem('sso_state');
      const returnedState = searchParams.get('state');
      if (expectedState && returnedState !== expectedState) {
        setError('This sign-in attempt could not be verified. Please try again.');
        return;
      }

      const { data, error: exchangeError } = await supabase.functions.invoke('sso-exchange', {
        body: { code },
      });
      if (cancelled) return;

      if (exchangeError || !data?.hashed_token) {
        setError('This sign-in link is invalid or has expired. Please try again.');
        return;
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.hashed_token,
        type: 'magiclink',
      });
      if (cancelled) return;

      if (verifyError) {
        setError('Could not complete sign-in. Please try again.');
        return;
      }

      navigate('/dashboard', { replace: true });
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="text-sm text-primary hover:underline font-medium"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
    </div>
  );
}
