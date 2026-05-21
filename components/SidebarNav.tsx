'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const nav = [
  { label: 'Lender Intelligence', href: '/dashboard/lenders', icon: '◈', desc: 'Match deals to lenders' },
  { label: 'Deal Drafting', href: '/dashboard/drafting', icon: '✦', desc: 'AI email drafts' },
  { label: 'Inbound Handler', href: '/dashboard/inbound', icon: '⬡', desc: 'Lead scoring & response' },
  { label: 'CRM', href: '/dashboard/crm', icon: '◎', desc: 'Contacts & reminders' },
];

export function SidebarNav({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <motion.aside
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 flex-shrink-0 flex flex-col bg-[#0a1410] border-r border-[#1e3328] relative"
    >
      <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#c9a84c]/10 to-transparent pointer-events-none" />

      <div className="px-6 py-7 border-b border-[#1e3328]">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 5, scale: 1.05 }}
            transition={{ duration: 0.2 }}
            className="relative w-9 h-9 flex-shrink-0"
          >
            <Image src="/logo.png" alt="Roscap" fill className="object-contain" />
          </motion.div>
          <div>
            <p className="font-display text-xl font-light tracking-[0.2em] text-[#c9a84c]">ROSCAP</p>
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#2a4535] mt-0.5">Operations</p>
          </div>
        </div>
        <div className="h-px mt-5 bg-gradient-to-r from-[#c9a84c]/25 via-[#c9a84c]/8 to-transparent" />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {nav.map((item, i) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 + 0.2, duration: 0.4 }}
                whileHover={{ x: 4 }}
                onHoverStart={() => setHoveredItem(item.href)}
                onHoverEnd={() => setHoveredItem(null)}
                className={`
                  relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm
                  cursor-pointer transition-all duration-200 group
                  ${
                    active
                      ? 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border border-[#c9a84c]/15'
                      : 'text-[#4a7060] hover:text-[#8aab95] hover:bg-[#132019] border border-transparent'
                  }
                `}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#c9a84c] rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                <motion.span
                  animate={{ scale: active ? 1.1 : 1 }}
                  className="text-base w-5 text-center flex-shrink-0"
                >
                  {item.icon}
                </motion.span>

                <div className="flex-1 min-w-0">
                  <p className="font-medium leading-tight">{item.label}</p>
                  {(active || hoveredItem === item.href) && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-[#3a5845] mt-0.5 truncate"
                    >
                      {item.desc}
                    </motion.p>
                  )}
                </div>

                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}

        {user.role === 'admin' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="h-px bg-gradient-to-r from-transparent via-[#1e3328] to-transparent my-4 mx-2" />
            <p className="text-[9px] uppercase tracking-widest text-[#2a4535] px-3 mb-2">Admin</p>
            <Link href="/dashboard/users">
              <motion.div
                whileHover={{ x: 4 }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer
                  transition-all duration-200 border
                  ${
                    pathname.startsWith('/dashboard/users')
                      ? 'text-[#c9a84c] bg-[rgba(201,168,76,0.08)] border-[#c9a84c]/15'
                      : 'text-[#4a7060] hover:text-[#8aab95] hover:bg-[#132019] border-transparent'
                  }
                `}
              >
                <span className="text-base w-5 text-center">⊕</span>
                <span className="font-medium">Manage Users</span>
              </motion.div>
            </Link>
          </motion.div>
        )}
      </nav>

      <div className="px-4 py-5 border-t border-[#1e3328]">
        <motion.div
          whileHover={{ backgroundColor: 'rgba(201,168,76,0.04)' }}
          className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors duration-200"
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 rounded-full bg-[#c9a84c]/12 border border-[#c9a84c]/25 flex items-center justify-center"
            >
              <span className="text-sm font-semibold text-[#c9a84c]">{user.name.charAt(0)}</span>
            </motion.div>
            <div>
              <p className="text-sm text-[#8aab95] font-medium leading-tight">{user.name}</p>
              <p className="text-[9px] text-[#2a4535] uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, color: '#c9a84c' }}
            whileTap={{ scale: 0.9 }}
            onClick={signOut}
            disabled={signingOut}
            className="text-[#2a4535] transition-colors text-base p-1.5"
            title="Sign out"
          >
            {signingOut ? (
              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin block" />
            ) : (
              '↩'
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.aside>
  );
}
