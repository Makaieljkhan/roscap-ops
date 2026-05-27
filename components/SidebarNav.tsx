'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const nav = [
  { label: 'Lender Intelligence', href: '/dashboard/lenders', icon: '◈' },
  { label: 'Deal Drafting', href: '/dashboard/drafting', icon: '✦' },
  { label: 'CRM', href: '/dashboard/crm', icon: '◎' },
];

export function SidebarNav({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [out, setOut] = useState(false);

  async function signOut() {
    setOut(true);
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-56 flex-shrink-0 flex flex-col bg-[#0d2b1f] border-r border-[#1a4030]"
    >
      <div className="px-5 py-6 border-b border-[#1a4030]">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/logo.png" alt="Roscap" fill className="object-contain" />
          </div>
          <div>
            <p className="font-display text-lg font-light tracking-[0.15em] text-[#c9a84c]">ROSCAP</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-[#4a7060] mt-0.5">Operations</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {nav.map((item, i) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 + 0.1 }}
                whileHover={{ x: 3 }}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                  cursor-pointer transition-all duration-150
                  ${
                    active
                      ? 'bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20'
                      : 'text-[#6a9080] hover:text-[#a8c4b0] hover:bg-[#ffffff08] border border-transparent'
                  }
                `}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#c9a84c] rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="w-4 text-center text-base">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}

        {user.role === 'admin' && (
          <>
            <div className="h-px bg-[#1a4030] my-3 mx-1" />
            <p className="text-[9px] uppercase tracking-widest text-[#2d5040] px-3 mb-2">Admin</p>
            <Link href="/dashboard/users">
              <motion.div
                whileHover={{ x: 3 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-all border
                  ${
                    pathname.startsWith('/dashboard/users')
                      ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/20'
                      : 'text-[#6a9080] hover:text-[#a8c4b0] hover:bg-[#ffffff08] border-transparent'
                  }`}
              >
                <span className="w-4 text-center">⊕</span>
                <span className="font-medium">Manage Users</span>
              </motion.div>
            </Link>
          </>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-[#1a4030]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#c9a84c]/15 border border-[#c9a84c]/25 flex items-center justify-center">
              <span className="text-xs font-bold text-[#c9a84c]">{user.name.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm text-[#a8c4b0] font-medium leading-none">{user.name}</p>
              <p className="text-[9px] text-[#4a7060] uppercase tracking-wider mt-0.5">{user.role}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={signOut}
            disabled={out}
            className="text-[#2d5040] hover:text-[#c9a84c] transition-colors text-sm p-1"
            title="Sign out"
          >
            {out ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
            ) : (
              '↩'
            )}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
