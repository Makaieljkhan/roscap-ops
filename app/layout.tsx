import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import './globals.css';
import SidebarNav from '@/components/SidebarNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Roscap Ops',
  description: 'Internal property finance advisory platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F5F0E8] min-h-screen`}>
        <div className="flex min-h-screen">
          <aside className="w-60 bg-[#1B3A35] text-white flex flex-col flex-shrink-0">
            <div className="px-5 py-5 border-b border-white/10">
              <Image
                src="/logo.png"
                alt="Roscap"
                width={140}
                height={40}
                priority
                className="object-contain"
              />
            </div>
            <SidebarNav />
            <div className="px-5 py-4 border-t border-white/10">
              <p className="text-xs text-green-200/50">Roscap Ops Platform</p>
            </div>
          </aside>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
