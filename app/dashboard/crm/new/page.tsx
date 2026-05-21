'use client';

import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export default function NewContactPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/dashboard/crm" className="text-sm text-[#4a7060] hover:text-[#8aab95] transition-colors">
          ← Contacts
        </Link>
        <h1 className="font-display text-[2rem] font-light italic text-[#f0ebe0] mt-2">Add Contact</h1>
        <p className="text-sm text-[#4a7060] mt-1">Add a new client, introducer, or lender to the CRM.</p>
      </div>

      <div className="bg-[#132019] border border-[#1e3328] rounded-xl p-6">
        <ContactForm mode="create" />
      </div>
    </div>
  );
}
