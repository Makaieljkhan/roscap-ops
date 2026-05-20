import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase-server';

async function getStats() {
  const supabase = createServerSupabaseClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const [
      { count: lenders },
      { count: contacts },
      { count: newLeads },
      { count: reminders },
    ] = await Promise.all([
      supabase.from('lenders').select('*', { count: 'exact', head: true }),
      supabase.from('contacts').select('*', { count: 'exact', head: true }),
      supabase.from('inbound_leads').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('reminders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    return {
      lenders: lenders ?? 0,
      contacts: contacts ?? 0,
      newLeads: newLeads ?? 0,
      reminders: reminders ?? 0,
    };
  } catch {
    return { lenders: 0, contacts: 0, newLeads: 0, reminders: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif font-semibold text-[#1B3A35]">Roscap Ops</h1>
        <p className="text-sm text-gray-500 mt-1">Internal Operations Platform</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard title="Total Lenders" value={stats.lenders} icon={IconLenders} />
        <StatCard title="Total Contacts" value={stats.contacts} icon={IconContacts} />
        <StatCard title="New Leads Today" value={stats.newLeads} icon={IconLeads} />
        <StatCard title="Pending Reminders" value={stats.reminders} icon={IconReminders} />
      </div>

      {/* Quick Actions */}
      <div className="mb-10">
        <h2 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickAction
            href="/lenders/new"
            label="Add Lender"
            description="Add a new lender to the intelligence database"
            icon={IconLenders}
          />
          <QuickAction
            href="/drafting"
            label="New Draft"
            description="Generate a professional email draft"
            icon={IconDraft}
          />
          <QuickAction
            href="/inbound"
            label="View Leads"
            description="Review and action inbound enquiries"
            icon={IconInbound}
          />
          <QuickAction
            href="/crm"
            label="View Contacts"
            description="Manage your CRM and relationship reminders"
            icon={IconCRM}
          />
        </div>
      </div>

      {/* Platform Modules */}
      <div>
        <h2 className="text-[10px] font-semibold text-[#C9A84C] uppercase tracking-widest mb-4">Platform Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ModuleCard
            title="Module 1 — Lender Intelligence"
            description="Searchable database of lenders with appetite profiles, key contacts, and real-time status tracking."
            href="/lenders"
          />
          <ModuleCard
            title="Module 2 — Deal Drafting"
            description="AI-powered email drafting engine using deal context and tone-matched prompt templates."
            href="/drafting"
          />
          <ModuleCard
            title="Module 3 — CRM"
            description="Lightweight contact management with relationship health tracking and automated reminders."
            href="/crm"
          />
          <ModuleCard
            title="Module 4 — Inbound Handler"
            description="Automated lead scoring, AI-drafted responses, and partner alerts for inbound enquiries."
            href="/inbound"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.FC<{ className?: string }>;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 border-t-4 border-t-[#C9A84C] shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <Icon className="w-4 h-4 text-[#1B3A35]" />
      </div>
      <p className="text-3xl font-semibold text-[#1B3A35]">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#C9A84C]/40 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-[#1B3A35]/5 rounded-lg flex items-center justify-center group-hover:bg-[#C9A84C]/10 transition-colors duration-200">
          <Icon className="w-4 h-4 text-[#1B3A35]" />
        </div>
        <p className="text-sm font-semibold text-[#2C2C2C]">{label}</p>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </Link>
  );
}

function ModuleCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-[#C9A84C]/40 transition-all duration-200"
    >
      <h3 className="text-sm font-semibold text-[#1B3A35] mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </Link>
  );
}

function IconLenders({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function IconContacts({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconLeads({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function IconReminders({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function IconDraft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function IconInbound({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function IconCRM({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
