'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ContactForm, { ContactData } from '@/components/ContactForm';

interface Contact extends ContactData {
  id: string;
  created_at: string;
}

export default function EditContactPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchContact = useCallback(async () => {
    try {
      const res = await fetch(`/api/crm/contacts/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Not found');
      setContact(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load contact');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>;
  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
    </div>
  );
  if (!contact) return null;

  const initialData: Partial<ContactData> & { id: string } = {
    ...contact,
    last_deal_size: contact.last_deal_size ? String(contact.last_deal_size) : '',
    last_contact_date: contact.last_contact_date ?? '',
    last_deal_date: contact.last_deal_date ?? '',
    birthday: contact.birthday ?? '',
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/crm" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Contacts
        </Link>
        <h1 className="text-2xl font-serif font-semibold text-[#1B3A35] mt-2">Edit Contact</h1>
        <p className="text-sm text-gray-500 mt-1">{contact.full_name}</p>
      </div>
      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6">
        <ContactForm
          mode="edit"
          initialData={initialData}
          onSuccess={() => router.push('/crm')}
          onCancel={() => router.push('/crm')}
        />
      </div>
    </div>
  );
}
