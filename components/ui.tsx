'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
export const stagger = {
  show: { transition: { staggerChildren: 0.07 } },
};
export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

export function Card({
  children,
  className = '',
  delay = 0,
  hover = false,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -3, borderColor: 'rgba(201,168,76,0.35)' } : undefined}
      className={`
        bg-[#132019] border border-[#1e3328] rounded-xl p-6
        transition-all duration-300
        ${glow ? 'shadow-[0_0_30px_rgba(201,168,76,0.06)]' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  className = '',
  disabled,
  type = 'button',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none relative overflow-hidden';
  const sizes = { sm: 'px-3.5 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' };
  const variants = {
    primary:
      'bg-[#c9a84c] text-[#0b1612] hover:bg-[#e2c47a] font-semibold shadow-[0_2px_24px_rgba(201,168,76,0.25)] hover:shadow-[0_4px_40px_rgba(201,168,76,0.4)]',
    ghost:
      'border border-[#2a4535] text-[#8aab95] hover:border-[#c9a84c]/50 hover:text-[#c9a84c] hover:bg-[rgba(201,168,76,0.05)] bg-transparent',
    danger:
      'border border-red-800/50 text-red-400 hover:bg-red-950/30 hover:border-red-700 bg-transparent',
    success: 'bg-[#1a4a35] border border-[#2a6a4a] text-[#3d9970] hover:bg-[#1f5a40] font-medium',
  };
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={loading || disabled}
      type={type}
      onClick={onClick}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
}

export function Input({
  label,
  hint,
  error,
  className = '',
  ...props
}: {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] uppercase tracking-widest font-semibold text-[#4a7060]">
          {label}
        </label>
      )}
      <div
        className={`relative rounded-lg transition-all duration-200 ${focused ? 'ring-1 ring-[#c9a84c]/25' : ''}`}
      >
        <input
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full bg-[#0e1c17] border rounded-lg px-4 py-2.5 text-sm
            text-[#f0ebe0] placeholder-[#2a4535]
            focus:outline-none transition-all duration-200
            ${error ? 'border-red-700' : focused ? 'border-[#c9a84c]/50' : 'border-[#1e3328]'}
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && <p className="text-xs text-[#4a7060]">{hint}</p>}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-400"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  className = '',
  ...props
}: {
  label?: string;
  hint?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] uppercase tracking-widest font-semibold text-[#4a7060]">
          {label}
        </label>
      )}
      <textarea
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full bg-[#0e1c17] border rounded-lg px-4 py-3 text-sm
          text-[#f0ebe0] placeholder-[#2a4535] resize-none
          focus:outline-none transition-all duration-200
          ${focused ? 'border-[#c9a84c]/50 ring-1 ring-[#c9a84c]/20' : 'border-[#1e3328]'}
          ${className}
        `}
        {...props}
      />
      {hint && <p className="text-xs text-[#4a7060]">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  options,
  className = '',
  ...props
}: {
  label?: string;
  options: { value: string; label: string }[];
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[10px] uppercase tracking-widest font-semibold text-[#4a7060]">
          {label}
        </label>
      )}
      <select
        className={`w-full bg-[#0e1c17] border border-[#1e3328] rounded-lg px-4 py-2.5 text-sm text-[#f0ebe0] focus:outline-none focus:border-[#c9a84c]/50 focus:ring-1 focus:ring-[#c9a84c]/20 transition-all duration-200 cursor-pointer ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#132019] text-[#f0ebe0]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const badgeMap = {
  gold: 'bg-amber-950/60  text-amber-300   border-amber-800/50',
  green: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50',
  red: 'bg-red-950/60    text-red-300     border-red-800/50',
  grey: 'bg-[#1a2e22]     text-[#8aab95]  border-[#1e3328]',
  blue: 'bg-sky-950/60    text-sky-300     border-sky-800/50',
  purple: 'bg-purple-950/60 text-purple-300  border-purple-800/50',
};

export function Badge({
  label,
  variant = 'grey',
  dot = false,
  pulse = false,
}: {
  label: string;
  variant?: keyof typeof badgeMap;
  dot?: boolean;
  pulse?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeMap[variant]}`}
    >
      {dot && (
        <span className="relative flex w-1.5 h-1.5">
          {pulse && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50 bg-current" />
          )}
          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  trend,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: 'up' | 'down';
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, borderColor: 'rgba(201,168,76,0.3)' }}
      className="bg-[#132019] border border-[#1e3328] rounded-xl p-6 transition-all duration-300 cursor-default group"
    >
      <p className="text-[10px] uppercase tracking-widest text-[#4a7060] mb-3 group-hover:text-[#8aab95] transition-colors">
        {label}
      </p>
      <p className="font-display text-4xl font-light text-[#f0ebe0]">{value}</p>
      {sub && (
        <p className="text-xs text-[#4a7060] mt-2 flex items-center gap-1">
          {trend === 'up' && <span className="text-emerald-400">↑</span>}
          {trend === 'down' && <span className="text-red-400">↓</span>}
          {sub}
        </p>
      )}
    </motion.div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start justify-between mb-8"
    >
      <div>
        <h1 className="font-display text-[2.2rem] font-light italic tracking-wide text-[#f0ebe0] leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-[#4a7060] mt-1.5">{subtitle}</p>}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '3rem' }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="h-px bg-gradient-to-r from-[#c9a84c]/50 to-transparent mt-3"
        />
      </div>
      {action && (
        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-[#1e3328] ${className}`} />;
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: string;
  title: string;
  description?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {icon && <p className="text-4xl mb-4 opacity-30">{icon}</p>}
      <p className="font-display text-xl italic text-[#4a7060]">{title}</p>
      {description && <p className="text-sm text-[#2a4535] mt-2 max-w-xs">{description}</p>}
    </motion.div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />;
}

export function Toast({
  message,
  type = 'success',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}) {
  const styles = {
    success: 'border-emerald-800/50 bg-emerald-950/80 text-emerald-300',
    error: 'border-red-800/50 bg-red-950/80 text-red-300',
    info: 'border-[#c9a84c]/30 bg-[#132019] text-[#c9a84c]',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm text-sm font-medium shadow-xl ${styles[type]}`}
    >
      {message}
      <button onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity ml-2">
        ✕
      </button>
    </motion.div>
  );
}
