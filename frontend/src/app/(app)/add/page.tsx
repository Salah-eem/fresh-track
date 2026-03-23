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
    <div className="min-h-screen p-4 sm:p-6 pb-24 max-w-lg mx-auto bg-white">
      <header className="mb-8 mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Item</h1>
        <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
          Step {step === 'BARCODE' ? 1 : step === 'INFO' ? 2 : step === 'OCR' ? 3 : 4} of 4
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
        <div className="space-y-6">
          <p className="text-gray-600">Scan the barcode to automatically fetch product details.</p>
          
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video border-2 border-dashed border-gray-300 flex items-center justify-center">
            {scanning ? (
              <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-8 top-1/2 -mt-16 h-32 border-2 border-green-500 rounded-lg bg-green-500/10" />
                <button
                  onClick={stopScanner}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900/80 text-white text-sm font-medium rounded-full shadow-lg"
                >
                  Cancel Scan
                </button>
              </>
            ) : (
              <button
                onClick={startScanner}
                className="flex flex-col items-center justify-center text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
              >
                <Camera className="w-12 h-12 mb-3 text-gray-400" />
                <span className="font-medium">Tap to open Camera</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">or enter manually</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 3017620422003"
              className="flex-1 px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <button
              onClick={() => handleBarcodeSubmit(barcode)}
              disabled={loading || !barcode}
              className="px-5 py-3 bg-green-600 text-white rounded-xl shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center disabled:opacity-50"
            >
              <Search className="w-5 h-5 mr-1 -ml-1" /> Look up
            </button>
          </div>
          
          <button
             onClick={() => setStep('INFO')}
             className="w-full py-3 text-gray-500 font-medium hover:text-gray-900 transition-colors"
          >
            Skip barcode completely
          </button>
        </div>
      )}

      {/* STEP 2: INFO */}
      {step === 'INFO' && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-gray-600">Verify and edit product details.</p>
          
          {imageUrl && (
            <div className="flex justify-center mb-6">
              <img src={imageUrl} alt="Product" className="h-32 object-contain rounded-xl shadow-sm border border-gray-100" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <button
            onClick={() => setStep('OCR')}
            disabled={!name}
            className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl shadow font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            Continue to Expiry Date
          </button>
        </div>
      )}

      {/* STEP 3: OCR */}
      {step === 'OCR' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-gray-600">Take a photo of the expiry date printed on the packaging.</p>
          
          <div className="relative rounded-2xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-8 group hover:bg-gray-100 transition">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={loading}
            />
            <Upload className="w-12 h-12 mb-3 text-green-500 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-gray-700">{loading ? 'Scanning AI Date...' : 'Tap to Upload or Photo'}</span>
            <span className="text-sm text-gray-400 mt-1">Make sure the date is clearly visible</span>
          </div>

          <div className="relative pt-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">or enter manually</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date <span className="text-red-500">*</span></label>
            <div className="relative">
              <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={() => setStep('CONFIRM')}
            disabled={!expiryDate}
            className="w-full mt-6 py-3 bg-green-600 text-white rounded-xl shadow font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            Review Details
          </button>
        </div>
      )}

      {/* STEP 4: CONFIRM */}
      {step === 'CONFIRM' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-gray-600">Review your item before saving to inventory.</p>
          
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 shadow-sm">
            {imageUrl && (
               <img src={imageUrl} alt={name} className="w-24 h-24 object-contain rounded-xl mx-auto mb-6 bg-white shadow-sm" />
            )}
            
            <dl className="space-y-4">
              <div className="flex justify-between pb-3 border-b border-gray-200">
                <dt className="text-sm font-medium text-gray-500">Product</dt>
                <dd className="text-sm font-bold text-gray-900 text-right">{name}</dd>
              </div>
              {brand && (
                <div className="flex justify-between pb-3 border-b border-gray-200">
                  <dt className="text-sm font-medium text-gray-500">Brand</dt>
                  <dd className="text-sm font-medium text-gray-900 text-right">{brand}</dd>
                </div>
              )}
               <div className="flex justify-between pb-3 border-b border-gray-200">
                <dt className="text-sm font-medium text-gray-500">Barcode</dt>
                <dd className="text-sm font-medium text-gray-900 text-right">{barcode || 'Manual Entry'}</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-sm font-medium text-gray-500">Expiring On</dt>
                <dd className="text-sm font-bold text-red-600 text-right">
                  {expiryDate ? format(new Date(expiryDate), 'MMMM do, yyyy') : 'No Date'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex gap-3">
             <button
              onClick={() => setStep('INFO')}
              className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl shadow-sm font-medium hover:bg-gray-50 transition"
            >
              Edit
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-[2] py-3 bg-green-600 text-white rounded-xl shadow font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save to Fridge'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
