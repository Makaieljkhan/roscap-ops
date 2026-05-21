'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader, Card, Button, Input, Badge } from '@/components/ui';

type AppUser = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    username: '',
    display_name: '',
    password: '',
    role: 'user',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) {
      const d = await res.json();
      setUsers(d.users || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser() {
    setSaving(true);
    setError('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error);
      setSaving(false);
      return;
    }
    setForm({ username: '', display_name: '', password: '', role: 'user' });
    setAdding(false);
    setSaving(false);
    load();
  }

  async function removeUser(id: string) {
    if (!confirm('Remove this user?')) return;
    await fetch('/api/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title="Manage Users"
        subtitle="Add or remove platform access"
        action={
          <Button onClick={() => setAdding((v) => !v)} variant={adding ? 'ghost' : 'primary'} size="sm">
            {adding ? 'Cancel' : '+ Add User'}
          </Button>
        }
      />

      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card>
            <p className="font-display text-lg italic text-[#ede8df] mb-5">New User</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="e.g. sarah"
              />
              <Input
                label="Display Name"
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                placeholder="e.g. Sarah"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Temporary password"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#3a5045]">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full bg-[#0f1d17] border border-[#1e3028] rounded-lg px-4 py-2.5 text-sm text-[#ede8df] focus:outline-none focus:border-[#c9a84c]/50 transition-all"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
            <Button onClick={addUser} loading={saving}>
              Create User
            </Button>
          </Card>
        </motion.div>
      )}

      <Card>
        {loading ? (
          <p className="text-[#3a5045] text-sm">Loading...</p>
        ) : (
          <div className="divide-y divide-[#1e3028]">
            {users.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#c9a84c]">
                      {u.display_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#ede8df] font-medium">{u.display_name}</p>
                    <p className="text-xs text-[#3a5045]">@{u.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge label={u.role} variant={u.role === 'admin' ? 'gold' : 'grey'} />
                  <Button variant="danger" size="sm" onClick={() => removeUser(u.id)}>
                    Remove
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
