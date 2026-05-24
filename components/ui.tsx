'use client';

import { motion } from 'framer-motion';
import React, { useState } from 'react';

export function Card({
  children,
  className = '',
  delay = 0,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hover ? { y: -2, boxShadow: '0 8px 32px rgba(13,43,31,0.08)' } : undefined}
      className={`bg-white border border-[#ddd6c8] rounded-xl p-6 shadow-sm transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger' | 'success';

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
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none';
  const sizes = { sm: 'px-3.5 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-7 py-3 text-base' };
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[#0d2b1f] text-white hover:bg-[#1a4030] shadow-sm hover:shadow-md',
    gold: 'bg-[#c9a84c] text-[#0d2b1f] hover:bg-[#e2c47a] font-semibold shadow-sm',
    ghost: 'border border-[#ddd6c8] text-[#3d5a4a] hover:border-[#c9a84c] hover:text-[#0d2b1f] bg-white',
    danger: 'border border-red-200 text-red-600 hover:bg-red-50 bg-white',
    success: 'bg-[#f0f7f4] border border-[#2d6a4f]/20 text-[#2d6a4f] hover:bg-[#e0f0e8]',
  };
  return (
    <motion.button
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.975 }}
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

export function FormField({
  label,
  children,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[#7a9080]">{hint}</p>}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  required,
  className = '',
  ...props
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <input
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full bg-white border rounded-lg px-4 py-2.5 text-sm text-[#0d2b1f]
          placeholder-[#aaa] transition-all duration-150
          ${
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-100'
              : focused
                ? 'border-[#c9a84c] ring-2 ring-[#c9a84c]/15'
                : 'border-[#ddd6c8]'
          }
          ${className}
        `}
        {...props}
      />
      {hint && <p className="text-xs text-[#7a9080]">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  required,
  className = '',
  ...props
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`
          w-full bg-white border rounded-lg px-4 py-3 text-sm text-[#0d2b1f]
          placeholder-[#aaa] resize-none transition-all duration-150
          ${focused ? 'border-[#c9a84c] ring-2 ring-[#c9a84c]/15' : 'border-[#ddd6c8]'}
          ${className}
        `}
        {...props}
      />
      {hint && <p className="text-xs text-[#7a9080]">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  options,
  required,
  className = '',
  ...props
}: {
  label?: string;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-[#3d5a4a] uppercase tracking-wider">
          {label}
          {required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        className={`w-full bg-white border border-[#ddd6c8] rounded-lg px-4 py-2.5 text-sm text-[#0d2b1f] focus:outline-none focus:border-[#c9a84c] focus:ring-2 focus:ring-[#c9a84c]/15 transition-all duration-150 cursor-pointer ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const badgeMap: Record<string, string> = {
  gold: 'bg-amber-50   text-amber-700   border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50     text-red-600     border-red-200',
  grey: 'bg-gray-50    text-gray-600    border-gray-200',
  blue: 'bg-sky-50     text-sky-700     border-sky-200',
  orange: 'bg-orange-50  text-orange-700  border-orange-200',
};

export function Badge({
  label,
  variant = 'grey',
  dot = false,
}: {
  label: string;
  variant?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeMap[variant] || badgeMap.grey}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {label}
    </span>
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
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start justify-between mb-8"
    >
      <div>
        <h1 className="font-display text-[2rem] font-light italic text-[#0d2b1f] leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-[#7a9080] mt-1">{subtitle}</p>}
        <div className="h-px w-12 bg-gradient-to-r from-[#c9a84c] to-transparent mt-3" />
      </div>
      {action && (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(13,43,31,0.08)' }}
      className="bg-white border border-[#ddd6c8] rounded-xl p-6 shadow-sm transition-all duration-300"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-[#7a9080] mb-2">{label}</p>
      <p className="font-display text-4xl font-light text-[#0d2b1f]">{value}</p>
      {sub && <p className="text-xs text-[#7a9080] mt-2">{sub}</p>}
    </motion.div>
  );
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      {icon && <p className="text-5xl mb-4">{icon}</p>}
      <p className="font-display text-xl italic text-[#7a9080]">{title}</p>
      {description && <p className="text-sm text-[#aaa] mt-2 max-w-xs">{description}</p>}
    </motion.div>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-[#ddd6c8] ${className}`} />;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[#3d5a4a]">{children}</p>
      <div className="flex-1 h-px bg-[#ddd6c8]" />
    </div>
  );
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
    success: 'border-emerald-200 bg-white text-emerald-700',
    error: 'border-red-200 bg-white text-red-600',
    info: 'border-[#ddd6c8] bg-white text-[#0d2b1f]',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-lg text-sm font-medium ${styles[type]}`}
    >
      {message}
      <button
        onClick={onClose}
        className="opacity-40 hover:opacity-80 transition-opacity ml-2 text-base"
      >
        ✕
      </button>
    </motion.div>
  );
}
