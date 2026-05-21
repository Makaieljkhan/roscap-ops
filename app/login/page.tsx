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
    <div className="min-h-screen bg-[#0b1612] flex items-center justify-center relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c9a84c] rounded-full blur-[250px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#1a4030] rounded-full blur-[180px] pointer-events-none"
      />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(#c9a84c 1px,transparent 1px),linear-gradient(90deg,#c9a84c 1px,transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm px-4 relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-center mb-10"
        >
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            className="relative w-12 h-12 mx-auto mb-4"
          >
            <Image src="/logo.png" alt="Roscap" fill className="object-contain" />
          </motion.div>
          <p className="font-display text-5xl font-light italic tracking-[0.15em] text-gold-gradient">
            ROSCAP
          </p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '4rem' }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="h-px bg-gradient-to-r from-transparent via-[#c9a84c]/50 to-transparent mx-auto mt-4"
          />
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#2a4535] mt-3">
            Operations Platform
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-[#0e1c17] border border-[#1e3328] rounded-2xl p-8 space-y-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
        >
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-semibold text-[#3a5045]">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="suleman or clemente"
              className="w-full bg-[#0b1612] border border-[#1e3328] rounded-xl px-4 py-3 text-sm text-[#f0ebe0] placeholder-[#1e3328] focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/15 transition-all duration-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest font-semibold text-[#3a5045]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="••••••••"
              className="w-full bg-[#0b1612] border border-[#1e3328] rounded-xl px-4 py-3 text-sm text-[#f0ebe0] placeholder-[#1e3328] focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/15 transition-all duration-200"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-300 bg-red-950/30 border border-red-800/30 rounded-xl px-4 py-2.5"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 8px 40px rgba(201,168,76,0.35)' }}
            whileTap={{ scale: 0.97 }}
            onClick={login}
            disabled={loading || !username || !password}
            className="w-full bg-[#c9a84c] hover:bg-[#e2c47a] text-[#0b1612] font-semibold py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(201,168,76,0.2)]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#0b1612] border-t-transparent rounded-full animate-spin" />
                Signing in
              </span>
            ) : (
              'Sign In →'
            )}
          </motion.button>
        </motion.div>

        <p className="text-center text-[#1a2e22] text-xs mt-8 tracking-wider">
          Confidential · Internal Use Only
        </p>
      </motion.div>
    </div>
  );
}
