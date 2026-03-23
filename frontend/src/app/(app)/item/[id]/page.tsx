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
    <div className="min-h-screen p-4 sm:p-6 pb-24 max-w-lg mx-auto bg-gray-50">
      <header className="mb-6 mt-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
           className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Edit Item</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 flex items-center">
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        {item.imageUrl && (
          <div className="flex justify-center mb-2">
            <img src={item.imageUrl} alt={item.name} className="h-32 object-contain rounded-xl" />
          </div>
        )}

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
           <input
             type="text"
             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
             value={name}
             onChange={(e) => setName(e.target.value)}
           />
        </div>

        <div>
           <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
           <input
             type="date"
             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
             value={expiryDate}
             onChange={(e) => setExpiryDate(e.target.value)}
           />
        </div>

        <div className="pt-4 flex gap-3">
          <button
            onClick={handleDelete}
            className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center flex-1"
          >
            <Trash2 className="w-5 h-5 mr-1" /> Delete
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving || !name || !expiryDate}
            className="px-4 py-3 bg-green-600 text-white rounded-xl shadow font-medium hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center flex-[2]"
          >
            <Save className="w-5 h-5 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
