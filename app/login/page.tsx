'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function login() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Invalid credentials');
      setLoading(false);
      return;
    }
    router.push('/dashboard/lenders');
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center relative overflow-hidden px-4">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 30% 20%, rgba(201,168,76,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(13,43,31,0.05) 0%, transparent 50%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="relative w-12 h-12 mx-auto mb-4"
          >
            <Image src="/logo.png" alt="Roscap" fill className="object-contain" />
          </motion.div>
          <p className="font-display text-5xl font-light italic text-[#0d2b1f] tracking-wide">ROSCAP</p>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-[#c9a84c]/60 to-transparent mx-auto mt-4" />
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#7a9080] mt-3">
            Operations Platform
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white border border-[#ddd6c8] rounded-2xl p-8 space-y-5 shadow-lg"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="suleman or clemente"
              className="w-full bg-white border border-[#ddd6c8] rounded-xl px-4 py-3 text-sm text-[#0d2b1f] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/15 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="••••••••"
              className="w-full bg-white border border-[#ddd6c8] rounded-xl px-4 py-3 text-sm text-[#0d2b1f] placeholder-[#aaa] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/15 transition-all"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={login}
            disabled={loading || !username || !password}
            className="w-full bg-[#0d2b1f] hover:bg-[#1a4030] text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in
              </span>
            ) : (
              'Sign In →'
            )}
          </motion.button>
        </motion.div>

        <p className="text-center text-[#aaa] text-xs mt-8 tracking-wider">
          Confidential · Internal Use Only
        </p>
      </motion.div>
    </div>
  );
}
