"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Warehouse, FloppyDisk, ArrowsClockwise } from '@phosphor-icons/react';

interface WarehouseAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const DEFAULT: WarehouseAddress = {
  name: 'CourierX Warehouse',
  phone: '9999999999',
  address: 'Gopalpur',
  city: 'Cuttack',
  state: 'Odisha',
  pincode: '753011',
};

export default function WarehouseSettings() {
  const [form, setForm] = useState<WarehouseAddress>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { setLoading(false); return; }
      try {
        const r = await fetch('/api/admin/settings', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const res = await r.json();
        if (res.data?.value) setForm(res.data.value);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Warehouse address saved.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Save failed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof WarehouseAddress; label: string; placeholder: string }[] = [
    { key: 'name', label: 'Warehouse Name', placeholder: 'CourierX Warehouse' },
    { key: 'phone', label: 'Contact Phone', placeholder: '9999999999' },
    { key: 'address', label: 'Street Address', placeholder: 'Gopalpur' },
    { key: 'city', label: 'City', placeholder: 'Cuttack' },
    { key: 'state', label: 'State', placeholder: 'Odisha' },
    { key: 'pincode', label: 'Pincode', placeholder: '753011' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <Warehouse className="h-5 w-5 text-red-400" />
        </div>
        <div>
          <h1 className="text-white font-semibold text-lg">Warehouse Settings</h1>
          <p className="text-gray-500 text-sm">Default pickup destination for international shipments</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <ArrowsClockwise className="h-4 w-4 animate-spin" weight="bold" />
          Loading...
        </div>
      ) : (
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ key, label, placeholder }) => (
              <div key={key} className={key === 'address' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
                <input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-colors"
                />
              </div>
            ))}
          </div>

          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? <ArrowsClockwise className="h-4 w-4 animate-spin" weight="bold" /> : <FloppyDisk className="h-4 w-4" weight="bold" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}
    </div>
  );
}
