'use client';

import Link from 'next/link';
import ContactForm from '@/components/ContactForm';

export default function NewContactPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/crm" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Contacts
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Add Contact</h1>
        <p className="text-sm text-gray-500 mt-1">Add a new client, introducer, or lender to the CRM.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <ContactForm mode="create" />
      </div>
    </div>
  );
}
