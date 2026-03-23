"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../lib/api';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  expiryDate: string;
}

export default function ItemDetail() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  useEffect(() => {
    if (itemId) fetchItem();
  }, [itemId]);

  const fetchItem = async () => {
    try {
      const { data } = await api.get(`/inventory/${itemId}`);
      setItem(data);
      setName(data.name);
      setExpiryDate(new Date(data.expiryDate).toISOString().split('T')[0]);
    } catch (err) {
      setError('Item not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await api.patch(`/inventory/${itemId}`, { name, expiryDate });
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to update item');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/inventory/${itemId}`);
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!item) return <div className="min-h-screen flex text-red-500 items-center justify-center">{error}</div>;

  return (
    <div className="min-h-screen p-6 pb-32 max-w-lg mx-auto page-transition">
      <header className="mb-10 mt-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
           className="p-3 -ml-3 text-foreground/40 hover:text-primary transition-all rounded-2xl glass-card border-white/10 active:scale-95"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">Edit Item</h1>
        <div className="w-12"></div>
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 flex items-center">
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="glass-card rounded-3xl p-8 space-y-8 shadow-2xl border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full" />
        
        {item.imageUrl && (
          <div className="flex justify-center mb-4">
            <div className="p-4 glass-card rounded-3xl shadow-lg bg-background/50">
              <img src={item.imageUrl} alt={item.name} className="h-40 w-40 object-contain rounded-2xl" />
            </div>
          </div>
        )}

        <div className="space-y-6 relative z-10">
          <div>
             <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 ml-1">Product Name</label>
             <input
               type="text"
               required
               className="w-full px-5 py-4 glass-card border-none text-foreground rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-lg transition-all"
               value={name}
               onChange={(e) => setName(e.target.value)}
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-3 ml-1">Expiry Date</label>
             <input
               type="date"
               className="w-full px-5 py-4 glass-card border-none text-foreground rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold transition-all appearance-none"
               value={expiryDate}
               onChange={(e) => setExpiryDate(e.target.value)}
             />
          </div>
        </div>

        <div className="pt-6 flex gap-4 relative z-10">
          <button
            onClick={handleDelete}
            className="px-6 py-4 glass-card border border-red-500/20 text-red-500 rounded-2xl font-bold hover:bg-red-500/10 transition-all flex items-center justify-center flex-1 active:scale-95"
          >
            <Trash2 className="w-5 h-5 mr-1" /> Delete
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving || !name || !expiryDate}
            className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 font-black text-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center flex-[2] active:scale-95"
          >
            <Save className="w-5 h-5 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

    </div>
  );
}
