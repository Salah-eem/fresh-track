"use client";

import { useState } from 'react';
import { X, Check, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

interface ScannedProduct {
  name: string;
  brand: string | null;
  quantity: string | number | null;
  category: string | null;
  price: number | null;
}

interface Props {
  items: ScannedProduct[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function ReceiptReviewModal({ items: initialItems, onClose, onConfirm }: Props) {
  const [items, setItems] = useState<ScannedProduct[]>(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ScannedProduct, value: string | number | null) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Assuming there's a batch add endpoint in /inventory
      // If not, we might need to call add for each item (less efficient)
      // I'll check inventory controller later, for now let's assume /inventory/batch exists or we'll make it
      await Promise.all(
        items.map((item) =>
          api.post('/inventory', {
            name: item.name,
            brand: item.brand || '',
            category: item.category || 'Pantry',
            quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 1 : item.quantity || 1,
            unit: 'pcs', // Default unit
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Dummy expiry 1 week later
          })
        )
      );
      onConfirm();
    } catch (err) {
      console.error('Failed to add items', err);
      alert('Failed to add some items to your inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-white/20 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-primary/10 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Review Products</h2>
            <p className="text-foreground/50 text-sm">Verify the extracted items before adding them</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-foreground/50" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(index, 'name', e.target.value)}
                  className="w-full bg-transparent text-foreground font-bold outline-none focus:text-primary transition-colors"
                  placeholder="Product Name"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.brand || ''}
                    onChange={(e) => updateItem(index, 'brand', e.target.value)}
                    className="flex-1 bg-white/5 rounded-lg px-2 py-1 text-xs text-foreground/70 outline-none border border-transparent focus:border-white/20"
                    placeholder="Brand"
                  />
                  <input
                    type="text"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="w-16 bg-white/5 rounded-lg px-2 py-1 text-xs text-foreground/70 outline-none border border-transparent focus:border-white/20 text-center"
                    placeholder="Qty"
                  />
                </div>
              </div>
              <button 
                onClick={() => removeItem(index)}
                className="self-center p-2 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
          
          {items.length === 0 && (
            <div className="text-center py-10 text-foreground/40">
              No items detected. Try another photo.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 p-4 rounded-2xl border border-white/10 text-foreground font-bold hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || items.length === 0}
            className="flex-[2] p-4 rounded-2xl bg-green-800 text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Check className="w-6 h-6" />
                <span>Add {items.length} Items</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
