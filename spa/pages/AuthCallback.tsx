import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../components/AuthProvider';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [status, setStatus] = useState('Connecting to Los Santos...');

  useEffect(() => {
    // Immediately remove static splash screen if present
    const shell = document.getElementById('seo-shell');
    if (shell) {
      shell.remove();
    }

    let isMounted = true;

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const nextParam =
          searchParams.get('next') ||
          searchParams.get('redirect') ||
          (typeof window !== 'undefined' ? localStorage.getItem('vital_auth_redirect') : null) ||
          '/';

        if (code) {
          setStatus('Verifying authentication credentials...');
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch (exchangeErr) {
            console.warn('[VitalAuth Callback] Code exchange notice:', exchangeErr);
          }
        }

        // Check if hash has implicit access token
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
          setStatus('Establishing active session...');
        }

        setStatus('Synchronizing user profile...');
        // Refresh session in AuthProvider to load user data and admin status
        await refresh();

        if (typeof window !== 'undefined') {
          localStorage.removeItem('vital_auth_redirect');
        }

        const destination = nextParam.startsWith('/') ? nextParam : '/' + nextParam;
        if (isMounted) {
          navigate(destination, { replace: true });
        }
      } catch (err) {
        console.error('[VitalAuth Callback] Error handling auth callback:', err);
        if (isMounted) {
          navigate('/', { replace: true });
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams, navigate, refresh]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-6 text-white selection:bg-vital-500 selection:text-white">
      <div className="w-16 h-16 rounded-2xl bg-vital-500/10 border border-vital-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.25)] mb-6">
        <img
          src="https://r2.fivemanage.com/image/qlWrCeXTQdqx.png"
          alt="Vital RP"
          className="w-10 h-10 aspect-square object-contain"
        />
      </div>
      <div className="font-display font-black text-2xl tracking-widest uppercase mb-2">
        VITAL <span className="text-vital-500">ROLEPLAY</span>
      </div>
      <div className="flex items-center gap-3 text-xs font-tech text-vital-400 uppercase tracking-widest font-bold">
        <div className="w-2.5 h-2.5 rounded-full bg-vital-500 animate-pulse shadow-[0_0_10px_#f97316]" />
        <span>{status}</span>
      </div>
    </div>
  );
};
