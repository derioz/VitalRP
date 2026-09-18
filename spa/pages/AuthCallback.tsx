import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../../components/AuthProvider';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh } = useAuth();
  const [status, setStatus] = useState('Connecting to Los Santos...');
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    // Immediately remove static splash screen if present
    const shell = document.getElementById('seo-shell');
    if (shell) {
      shell.remove();
    }

    if (hasExecutedRef.current) {
      return;
    }
    hasExecutedRef.current = true;

    // Determine redirect destination
    const paramNext =
      searchParams.get('next') ||
      searchParams.get('redirect') ||
      (typeof window !== 'undefined' ? localStorage.getItem('vital_auth_redirect') : null) ||
      '/';

    const rawDestination = paramNext.startsWith('/') ? paramNext : '/' + paramNext;
    // Guard against redirect loops
    const destination =
      rawDestination === '/auth/callback' || rawDestination.startsWith('/auth/callback')
        ? '/'
        : rawDestination;

    // Safety fallback: if anything stalls after 2 seconds, force redirect
    const safetyTimer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.location.pathname.includes('/auth/callback')) {
        console.warn('[VitalAuth Callback] Safety timeout reached, navigating to:', destination);
        window.location.replace(destination);
      }
    }, 2000);

    const handleCallback = async () => {
      try {
        const error = searchParams.get('error') || searchParams.get('error_description');
        if (error) {
          console.warn('[VitalAuth Callback] OAuth error returned:', error);
          setStatus('Authentication cancelled. Returning home...');
          navigate('/', { replace: true });
          return;
        }

        const code = searchParams.get('code');

        if (code) {
          setStatus('Verifying authentication credentials...');
          try {
            await supabase.auth.exchangeCodeForSession(code);
          } catch (exchangeErr) {
            console.warn('[VitalAuth Callback] Code exchange notice:', exchangeErr);
          }
        }

        // Clean up temporary stored redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vital_auth_redirect');
        }

        setStatus('Synchronizing user profile...');

        // Non-blocking profile synchronization: wait at most 500ms for initial load, then redirect immediately
        try {
          await Promise.race([
            refresh(),
            new Promise((resolve) => setTimeout(resolve, 500)),
          ]);
        } catch (refreshErr) {
          console.warn('[VitalAuth Callback] Non-blocking refresh notice:', refreshErr);
        }

        setStatus('Welcome to Los Santos!');

        // Transition immediately to destination
        navigate(destination, { replace: true });

        // Secondary fallback in case React Router navigation didn't update window location
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location.pathname.includes('/auth/callback')) {
            window.location.replace(destination);
          }
        }, 300);
      } catch (err) {
        console.error('[VitalAuth Callback] Error handling callback:', err);
        navigate('/', { replace: true });
      } finally {
        clearTimeout(safetyTimer);
      }
    };

    handleCallback();

    return () => {
      clearTimeout(safetyTimer);
    };
  }, []); // Run strictly once on mount

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
