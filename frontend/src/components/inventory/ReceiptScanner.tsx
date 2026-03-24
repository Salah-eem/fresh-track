"use client";

import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X } from 'lucide-react';
import { api } from '../../lib/api';
import ReceiptReviewModal from './ReceiptReviewModal';

interface ScannedProduct {
  name: string;
  brand: string | null;
  quantity: string | number | null;
  category: string | null;
  price: number | null;
}

export default function ReceiptScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedProduct[]>([]);
  const [showReview, setShowReview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        try {
          const { data } = await api.post('/ocr/process-receipt', { base64Image });
          setScannedItems(data.products);
          setShowReview(true);
        } catch (err) {
          console.error('Failed to process receipt', err);
          alert('Failed to process receipt. Please try again.');
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file', err);
      setIsScanning(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div className="flex gap-4">
        <button
          onClick={triggerFileInput}
          disabled={isScanning}
          className="flex-1 flex items-center justify-center gap-2 p-4 glass-card rounded-2xl text-primary hover:scale-[1.02] active:scale-95 transition-all shadow-lg border-primary/10 disabled:opacity-50 font-bold"
        >
          {isScanning ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Camera className="w-6 h-6" />
              <span>Scan Receipt</span>
            </>
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {showReview && (
        <ReceiptReviewModal
          items={scannedItems}
          onClose={() => setShowReview(false)}
          onConfirm={() => {
            setShowReview(false);
            // Optionally refresh inventory here
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
}
