"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Camera, Search, Upload, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

type Step = 'BARCODE' | 'INFO' | 'OCR' | 'CONFIRM';

export default function AddProduct() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('BARCODE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  // Scanner ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const [scanning, setScanning] = useState(false);

  // 1. BARCODE functions
  const startScanner = async () => {
    setScanning(true);
    setError('');
    try {
      // if (videoRef.current) {
        await codeReader.current.decodeFromVideoDevice(
          null,
          videoRef.current,
          (result, err) => {
            if (result) {
              setBarcode(result.getText());
              stopScanner();
              handleBarcodeSubmit(result.getText());
            }
          }
        );
      // }
    } catch (err) {
      setError('Camera access denied or unavailable');
      setScanning(false);
    }
  };

  const stopScanner = () => {
    codeReader.current.reset();
    setScanning(false);
  };

  const handleBarcodeSubmit = async (codeToSearch = barcode) => {
    if (!codeToSearch) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/products/barcode/${codeToSearch}`);
      setName(data.name || '');
      setBrand(data.brand || '');
      setImageUrl(data.imageUrl || '');
      setStep('INFO');
    } catch (err) {
      // If not found in OpenFoodFacts, just proceed to manual entry
      setStep('INFO');
      setError('Product not found in database. Please enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  // 3. OCR Functions
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        try {
          const { data } = await api.post('/ocr/extract-date', { base64Image });
          if (data.detectedDate) {
            setExpiryDate(data.detectedDate);
            setStep('CONFIRM');
          } else {
            setError('Could not detect date. Please enter manually.');
          }
        } catch (apiErr) {
          setError('OCR failed. Please enter manually.');
        } finally {
          setLoading(false);
        }
      };
    } catch (err) {
      setError('Error processing image');
      setLoading(false);
    }
  };

  // 4. Save Final
  const handleSave = async () => {
    if (!name || !expiryDate) {
      setError('Name and Expiry Date are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/inventory', {
        barcode: barcode || 'MANUAL-' + Date.now(), // fallback if no barcode
        name,
        brand,
        imageUrl,
        expiryDate,
      });
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to save item');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 pb-32 max-w-lg mx-auto page-transition">
      <header className="mb-10 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">Add Item</h1>
          <div className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/20">
            Step {step === 'BARCODE' ? 1 : step === 'INFO' ? 2 : step === 'OCR' ? 3 : 4} / 4
          </div>
        </div>
        <div className="w-full bg-foreground/5 h-1.5 rounded-full overflow-hidden flex gap-1">
          <div className={`h-full bg-primary transition-all duration-500 rounded-full ${step === 'BARCODE' ? 'w-1/4' : step === 'INFO' ? 'w-1/2' : step === 'OCR' ? 'w-3/4' : 'w-full'}`} />
        </div>
      </header>

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100 flex items-center">
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* STEP 1: BARCODE */}
      {step === 'BARCODE' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <p className="text-foreground/50 font-medium text-center">Scan the barcode to automatically fetch product details.</p>
          
          <div className="relative rounded-3xl overflow-hidden glass-card aspect-square border-2 border-dashed border-primary/30 flex items-center justify-center group shadow-2xl">
            {scanning ? (
              <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-12 top-1/2 -mt-20 h-40 border-2 border-primary rounded-2xl bg-primary/5 shadow-[0_0_100px_rgba(16,185,129,0.3)] animate-pulse" />
                <button
                  onClick={stopScanner}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  Cancel Scan
                </button>
              </>
            ) : (
              <button
                onClick={startScanner}
                className="flex flex-col items-center justify-center text-foreground/40 hover:text-primary transition-all duration-300 cursor-pointer group-hover:scale-110"
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Camera className="w-10 h-10 text-primary" />
                </div>
                <span className="font-bold tracking-tight">Tap to open Camera</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-foreground/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-transparent text-xs font-bold text-foreground/30 uppercase tracking-widest">or enter manually</span>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. 3017620422003"
              className="flex-1 px-5 py-4 glass-card border-none placeholder-foreground/20 text-foreground rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <button
              onClick={() => handleBarcodeSubmit(barcode)}
              disabled={loading || !barcode}
              className="px-6 py-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center disabled:opacity-50 active:scale-95 transition-all font-bold"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
          
          <button
             onClick={() => setStep('INFO')}
             className="w-full py-4 text-foreground/40 font-bold hover:text-primary transition-colors text-xs uppercase tracking-widest"
          >
            Skip barcode completely
          </button>
        </div>
      )}

      {/* STEP 2: INFO */}
      {step === 'INFO' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <p className="text-foreground/50 font-medium text-center">Verify and edit product details.</p>
          
          {imageUrl && (
            <div className="flex justify-center mb-8">
              <div className="p-4 glass-card rounded-3xl shadow-xl">
                <img src={imageUrl} alt="Product" className="h-40 w-40 object-contain rounded-2xl" />
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Product Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 glass-card border-none text-foreground rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-lg"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Brand</label>
              <input
                type="text"
                className="w-full px-5 py-4 glass-card border-none text-foreground rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setStep('OCR')}
            disabled={!name}
            className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            Continue to Expiry Date
          </button>
        </div>
      )}

      {/* STEP 3: OCR */}
      {step === 'OCR' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <p className="text-foreground/50 font-medium text-center">Take a photo of the expiry date on the packaging.</p>
          
          <div className="relative rounded-3xl overflow-hidden glass-card border-2 border-dashed border-primary/30 flex flex-col items-center justify-center p-12 group hover:bg-primary/5 transition-all shadow-xl">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={loading}
            />
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-all group-hover:scale-110">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <span className="font-bold text-foreground text-lg">{loading ? 'AI Analyzing Date...' : 'Capture Date'}</span>
            <span className="text-[10px] uppercase tracking-widest text-foreground/30 mt-2 font-bold">Automatic Detection</span>
          </div>

          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-foreground/5" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-transparent text-xs font-bold text-foreground/30 uppercase tracking-widest">or enter manually</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/40 uppercase tracking-widest mb-2 ml-1">Expiry Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <CalendarIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input
                type="date"
                required
                className="w-full pl-12 pr-5 py-4 glass-card border-none text-foreground rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary font-bold appearance-none"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setStep('CONFIRM')}
            disabled={!expiryDate}
            className="w-full mt-8 py-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20 font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
          >
            Review Details
          </button>
        </div>
      )}

      {/* STEP 4: CONFIRM */}
      {step === 'CONFIRM' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
          <p className="text-foreground/50 font-medium text-center">Review your item before saving to inventory.</p>
          
          <div className="glass-card rounded-3xl p-8 border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 blur-3xl -ml-16 -mb-16 rounded-full" />

            {imageUrl && (
               <div className="relative bg-background rounded-2xl p-2 w-28 h-28 mx-auto mb-8 shadow-inner border border-white/5">
                 <img src={imageUrl} alt={name} className="w-full h-full object-contain rounded-xl" />
               </div>
            )}
            
            <dl className="space-y-6 relative z-10">
              <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
                <dt className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Product</dt>
                <dd className="text-xl font-extrabold text-foreground">{name}</dd>
              </div>
              {brand && (
                <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
                  <dt className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Brand</dt>
                  <dd className="text-lg font-bold text-foreground/70">{brand}</dd>
                </div>
              )}
               <div className="flex flex-col gap-1 border-b border-white/5 pb-4">
                <dt className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Barcode</dt>
                <dd className="text-sm font-mono text-foreground/50">{barcode || 'Manual Entry'}</dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Expiry Date</dt>
                <dd className="text-2xl font-black text-red-500">
                  {expiryDate ? format(new Date(expiryDate), 'MMMM do, yyyy') : 'No Date'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-4">
             <button
              onClick={() => setStep('INFO')}
              className="flex-1 py-4 glass-card border border-white/10 text-foreground rounded-2xl shadow-xl font-bold hover:bg-foreground/5 transition-all active:scale-95"
            >
              Edit
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/30 font-black text-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save to Fridge'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
