/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, X, Volume2, VolumeX, AlertCircle, RefreshCw, CheckCircle2, Loader2, QrCode, Hash, FileText } from "lucide-react";
import Tesseract from "tesseract.js";

interface BarcodeScannerProps {
  onScanSuccess: (text: string) => void;
  onClose: () => void;
  onTriggerToast: (message: string, type: "success" | "error" | "info") => void;
}

// Helper function to extract contiguous digits from formats like IMEI1:"23465489655689" or IMEI: 358293091823912
const cleanAndExtractImei = (text: string): string => {
  if (!text) return "";
  const trimmed = text.trim();
  
  // 1. Check for labeled patterns (e.g., IMEI1:"23465489655689", IMEI: 358293091823912, imei2=123456789012345)
  // We match labels like imei, imei1, imei2, serial, sn, followed by optional non-alphanumeric chars and optional quotes.
  const labeledRegex = /(?:imei\d*|imeisv|sn|serial)\s*[:=]*\s*["']?([0-9]{14,16})["']?/i;
  const labeledMatch = trimmed.match(labeledRegex);
  if (labeledMatch && labeledMatch[1]) {
    return labeledMatch[1];
  }

  // 2. Fallback: Search for any 14-16 digit contiguous number block anywhere in the text
  const generalDigitsRegex = /([0-9]{14,16})/;
  const generalMatch = trimmed.match(generalDigitsRegex);
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1];
  }

  // 3. Fallback: If it's a sequence of digits with length >= 8, extract all digits
  const allDigits = trimmed.replace(/[^0-9]/g, "");
  if (allDigits.length >= 8) {
    return allDigits;
  }

  // 4. Default: Return original trimmed text as is (so standard barcodes still work)
  return trimmed;
};

export default function BarcodeScanner({
  onScanSuccess,
  onClose,
  onTriggerToast,
}: BarcodeScannerProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasAudio, setHasAudio] = useState(true);
  const [retrying, setRetrying] = useState(false);
  
  // Scan modes: 'barcode' or 'text' (OCR)
  const [scanMode, setScanMode] = useState<'barcode' | 'text'>('barcode');
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const scanModeRef = useRef<'barcode' | 'text'>('barcode');

  // Real-time alignment state: stores the barcode text currently in the viewfinder
  const [detectedInView, setDetectedInView] = useState<string | null>(null);
  // Extracted clean IMEI number
  const [extractedImei, setExtractedImei] = useState<string | null>(null);
  // Scanning state when user explicitly triggers scan but nothing is currently in view
  const [isWaitingForScan, setIsWaitingForScan] = useState(false);

  const [manualImei, setManualImei] = useState("");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const latestCodeRef = useRef<string | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync mode state with ref to avoid stale closures inside html5-qrcode's events
  useEffect(() => {
    scanModeRef.current = scanMode;
    // Reset scanner highlights when switching modes
    setDetectedInView(null);
    setExtractedImei(null);
    latestCodeRef.current = null;
  }, [scanMode]);

  const playBeep = () => {
    if (!hasAudio) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(1100, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.log("Audio beep playback issue:", e);
    }
  };

  // Canvas-cropping text extractor using Tesseract.js
  const captureAndProcessOcr = async (isAuto = false) => {
    if (isOcrProcessing || scanModeRef.current !== 'text') return;
    
    const video = document.querySelector("#html5-qrcode-scanner-element video") as HTMLVideoElement;
    if (!video) {
      if (!isAuto) {
        onTriggerToast("ကင်မရာ ဗီဒီယို ဖွင့်မထားပါ", "error");
      }
      return;
    }

    setIsOcrProcessing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not create canvas 2D context");

      // Draw active camera frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Crop center box matching viewfinder guidelines
      const cropWidth = Math.floor(canvas.width * 0.85);
      const cropHeight = Math.floor(canvas.height * 0.45);
      const cropX = Math.floor((canvas.width - cropWidth) / 2);
      const cropY = Math.floor((canvas.height - cropHeight) / 2);

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = cropWidth;
      cropCanvas.height = cropHeight;
      const cropCtx = cropCanvas.getContext("2d");
      if (cropCtx) {
        cropCtx.drawImage(
          canvas,
          cropX, cropY, cropWidth, cropHeight, // source rect
          0, 0, cropWidth, cropHeight          // dest rect
        );
        
        const dataUrl = cropCanvas.toDataURL("image/jpeg");
        
        // Feed cropped image to Tesseract OCR
        const result = await Tesseract.recognize(dataUrl, 'eng');
        const recognizedText = result.data.text;
        
        if (recognizedText && recognizedText.trim()) {
          const cleanImei = cleanAndExtractImei(recognizedText);
          if (cleanImei && cleanImei.length >= 8) {
            playBeep();
            setDetectedInView(recognizedText.trim());
            setExtractedImei(cleanImei);
            latestCodeRef.current = cleanImei;
            
            if (!isAuto) {
              onTriggerToast("စာသားမှ IMEI အောင်မြင်စွာ ဖတ်ရှုပြီးပါပြီ", "success");
            }
          } else {
            if (!isAuto) {
              onTriggerToast("စာသားဖတ်မိသော်လည်း IMEI နံပါတ် ရှာမတွေ့ပါ။", "info");
            }
          }
        } else {
          if (!isAuto) {
            onTriggerToast("မည်သည့်စာသားမှ မတွေ့ပါ", "info");
          }
        }
      }
    } catch (err) {
      console.error("OCR recognition error:", err);
      if (!isAuto) {
        onTriggerToast("နံပါတ် ဖတ်ရှုရာတွင် အမှားအယွင်းရှိပါသည်", "error");
      }
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // Run auto OCR scan every 2 seconds when in text mode
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (scanMode === 'text' && isScanning && !scannerError) {
      interval = setInterval(() => {
        captureAndProcessOcr(true);
      }, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanMode, isScanning, scannerError]);

  const startScanner = () => {
    setRetrying(true);
    setScannerError(null);
    setDetectedInView(null);
    setExtractedImei(null);
    latestCodeRef.current = null;
    const elementId = "html5-qrcode-scanner-element";

    const setupAndStart = async () => {
      try {
        if (html5QrcodeRef.current) {
          if (html5QrcodeRef.current.isScanning) {
            await html5QrcodeRef.current.stop();
          }
          html5QrcodeRef.current.clear();
        }

        const qrCode = new Html5Qrcode(elementId);
        html5QrcodeRef.current = qrCode;
        setIsScanning(true);

        // We configure qrbox to scan precisely inside the centered box,
        // matching our visual overlay of w-[85%] and h-[35%] exactly.
        await qrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: (width, height) => {
              const boxWidth = Math.floor(width * 0.85);
              const boxHeight = Math.floor(height * 0.35);
              return { width: boxWidth, height: boxHeight };
            },
          },
          (decodedText) => {
            // Ignore barcode scans if user is currently in Text/OCR mode
            if (scanModeRef.current === 'text') return;

            // Update the currently aligned code
            const cleanImei = cleanAndExtractImei(decodedText);
            latestCodeRef.current = cleanImei;
            setDetectedInView(decodedText);
            setExtractedImei(cleanImei);

            // If user has clicked "Scan" and we are actively waiting for a barcode to align
            if (isWaitingForScan) {
              setIsWaitingForScan(false);
              if (waitingTimeoutRef.current) {
                clearTimeout(waitingTimeoutRef.current);
              }
              playBeep();
              onTriggerToast("IMEI ဘားကုဒ် အောင်မြင်စွာ ဖတ်ရှုပြီးပါပြီ", "success");
              onScanSuccess(cleanImei);
              onClose();
              return;
            }

            // Reset detected code if it leaves the viewfinder for more than 1.2s
            if (resetTimeoutRef.current) {
              clearTimeout(resetTimeoutRef.current);
            }
            resetTimeoutRef.current = setTimeout(() => {
              latestCodeRef.current = null;
              setDetectedInView(null);
              setExtractedImei(null);
            }, 1200);
          },
          () => {
            // Silent error handler during scanning loops
          }
        );
        setScannerError(null);
      } catch (err) {
        console.error("Camera scanner start failed:", err);
        setScannerError(
          "Camera ဖွင့်မရပါ (သို့မဟုတ်) Browser ၏ Camera ခွင့်ပြုချက် (Permission) ပိတ်ထားပါသည်။ AI Studio Preview ၏ Iframe constraint ကြောင့်လည်း ဖြစ်နိုင်သဖြင့် ညာဘက်အပေါ်ထောင့်ရှိ 'Open in new tab' သင်္ကေတကိုနှိပ်ပြီး browser အသစ်ဖြင့်ဖွင့်ကာ ခွင့်ပြုချက်ပေးနိုင်ပါသည်။"
        );
        setIsScanning(false);
      } finally {
        setRetrying(false);
      }
    };

    setupAndStart();
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
      if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
        html5QrcodeRef.current
          .stop()
          .then(() => {
            html5QrcodeRef.current?.clear();
          })
          .catch((err) => {
            console.error("Cleanup error stopping camera scanner:", err);
          });
      }
    };
  }, []);

  // Handle explicit scan button click
  const handleTriggerScan = () => {
    // 1. If a barcode is already perfectly aligned in the viewfinder
    if (latestCodeRef.current) {
      playBeep();
      onTriggerToast("IMEI ဘားကုဒ် အောင်မြင်စွာ ဖတ်ရှုပြီးပါပြီ", "success");
      onScanSuccess(latestCodeRef.current);
      onClose();
      return;
    }

    // 2. If no barcode is aligned yet, activate waiting search mode
    setIsWaitingForScan(true);
    onTriggerToast("ကင်မရာကို ဘားကုဒ်အနီး တည့်တည့်ချိန်ပေးပါ...", "info");

    // Timeout if no barcode is found in 4 seconds
    if (waitingTimeoutRef.current) clearTimeout(waitingTimeoutRef.current);
    waitingTimeoutRef.current = setTimeout(() => {
      setIsWaitingForScan(false);
      onTriggerToast("ဘားကုဒ် ရှာမတွေ့ပါ။ ကင်မရာကို ဘားကုဒ်ပေါ်တည့်တည့် ချိန်ပြီးမှ ခလုတ်ကို နှိပ်ပေးပါ။", "error");
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 font-sans animate-fade-in">
      {/* Dark backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-950 text-indigo-400 p-2 rounded-xl">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 font-display">
                IMEI Barcode & Number Scanner
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {scanMode === 'barcode' 
                  ? "ကင်မရာချိန်ပြီးမှ 'Scan ဖတ်မည်' ကိုနှိပ်ပါ သို့မဟုတ် auto ဖတ်ပါ" 
                  : "နံပါတ်စာသားပေါ် ချိန်ထားပါ (Auto သို့မဟုတ် Capture နှိပ်ပါ)"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHasAudio(!hasAudio)}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
              title={hasAudio ? "Mute beep sound" : "Unmute beep sound"}
            >
              {hasAudio ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Tab Switcher */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/40 p-1">
          <button
            type="button"
            onClick={() => setScanMode('barcode')}
            className={`flex-1 py-2 text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
              scanMode === 'barcode'
                ? "bg-slate-800 text-indigo-400 border border-slate-700/80"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>ဘားကုဒ် / QR Code</span>
          </button>
          <button
            type="button"
            onClick={() => setScanMode('text')}
            className={`flex-1 py-2 text-xs font-bold transition-all rounded-xl flex items-center justify-center gap-1.5 cursor-pointer ${
              scanMode === 'text'
                ? "bg-slate-800 text-indigo-400 border border-slate-700/80"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Hash className="h-4 w-4" />
            <span>နံပါတ် / စာသား (OCR)</span>
          </button>
        </div>

        {/* Scanner Region */}
        <div className="flex-1 bg-black relative flex flex-col justify-center items-center min-h-[220px]">
          
          {/* Real Live Camera Viewport Element */}
          <div
            id="html5-qrcode-scanner-element"
            className="w-full h-full max-h-[300px] overflow-hidden"
            style={{ display: scannerError ? "none" : "block" }}
          />

          {/* Holographic scanning guide overlays */}
          {!scannerError && isScanning && (
            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none select-none">
              {/* Viewfinder helper text */}
              <div className="mt-4 flex flex-col items-center gap-1">
                {scanMode === 'text' ? (
                  detectedInView ? (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="h-3 w-3" />
                      နံပါတ် ဖတ်မိပါပြီ (အတည်ပြုရန် အောက်မှခလုတ်ကိုနှိပ်ပါ)
                    </span>
                  ) : isOcrProcessing ? (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      စာသားများ ဖတ်ယူနေဆဲဖြစ်ပါသည်...
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest bg-slate-950/80 px-2.5 py-1 rounded-full border border-indigo-500/30 flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      ကင်မရာအလယ်တွင် နံပါတ်/စာသား တည့်တည့်ချိန်ပါ
                    </span>
                  )
                ) : (
                  detectedInView ? (
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1 animate-pulse">
                      <CheckCircle2 className="h-3 w-3" />
                      ဘားကုဒ် ချိန်မိပါပြီ (အတည်ပြုရန် အောက်မှခလုတ်ကိုနှိပ်ပါ)
                    </span>
                  ) : isWaitingForScan ? (
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      ဘားကုဒ် ရှာဖွေနေပါသည်...
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest bg-slate-950/80 px-2.5 py-1 rounded-full border border-indigo-500/30">
                      ဘားကုဒ်အား အလယ်တည့်တည့် ချိန်ထားပါ
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* Error & Permission Blocked State */}
          {scannerError && (
            <div className="p-5 text-center max-w-sm space-y-4 animate-fade-in w-full">
              <div className="mx-auto w-10 h-10 bg-amber-950/40 text-amber-500 border border-amber-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="h-5 w-5" />
              </div>
              <p className="text-xs leading-relaxed text-slate-300">
                {scannerError}
              </p>
              
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={startScanner}
                  disabled={retrying}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer text-slate-200"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
                  ပြန်ကြိုးစားမည် (Retry)
                </button>
              </div>

              {/* Manual input fallback */}
              <div className="border-t border-slate-800/80 pt-4 mt-3 space-y-2.5 text-left">
                <span className="text-[11px] text-slate-400 block font-medium">
                  သို့မဟုတ် IMEI နံပါတ်အား ဤနေရာတွင် ကိုယ်တိုင်ရိုက်ထည့်ပါ -
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualImei}
                    onChange={(e) => setManualImei(e.target.value)}
                    placeholder="IMEI ရိုက်ထည့်ပါ..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!manualImei.trim()) {
                        onTriggerToast("IMEI ရိုက်ထည့်ပေးပါ", "error");
                        return;
                      }
                      const cleanImei = cleanAndExtractImei(manualImei);
                      onTriggerToast("IMEI အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ", "success");
                      onScanSuccess(cleanImei);
                      onClose();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                  >
                    ထည့်သွင်းမည်
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Real action scan buttons and instructions */}
        <div className="p-5 bg-slate-950 border-t border-slate-850 space-y-3.5">
          {!scannerError && isScanning && (
            <div className="space-y-3">
              {/* Aligned value presentation */}
              {detectedInView && (
                <div className="p-2.5 bg-slate-900 border border-emerald-500/20 rounded-xl space-y-2 text-xs animate-fade-in text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">ဖတ်မိသော စာသား</span>
                    <span className="font-medium text-slate-300 font-mono text-xs max-w-[200px] truncate" title={detectedInView}>
                      {detectedInView}
                    </span>
                  </div>
                  {extractedImei && extractedImei !== detectedInView && (
                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                      <span className="text-emerald-400 font-medium font-bold">သန့်စင်ပြီး IMEI</span>
                      <span className="font-bold text-emerald-400 font-mono text-sm tracking-wider">
                        {extractedImei}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Main Manual Scan Trigger Button */}
              <button
                type="button"
                onClick={scanMode === 'text' ? () => {
                  if (detectedInView && extractedImei) {
                    playBeep();
                    onTriggerToast("IMEI အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ", "success");
                    onScanSuccess(extractedImei);
                    onClose();
                  } else {
                    captureAndProcessOcr(false);
                  }
                } : handleTriggerScan}
                disabled={isWaitingForScan || (scanMode === 'text' && isOcrProcessing)}
                className={`w-full py-3.5 ${
                  detectedInView
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/30"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-950/30"
                } text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
              >
                {scanMode === 'text' ? (
                  isOcrProcessing ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>နံပါတ် ဖတ်ယူနေပါသည်...</span>
                    </>
                  ) : detectedInView ? (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      <span>ဤနံပါတ်အား အတည်ပြုထည့်သွင်းမည် (Use Number)</span>
                    </>
                  ) : (
                    <>
                      <FileText className="h-4.5 w-4.5" />
                      <span>နံပါတ် ဖတ်မည် (Capture Number)</span>
                    </>
                  )
                ) : (
                  isWaitingForScan ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>ဘားကုဒ် ရှာဖွေနေဆဲဖြစ်ပါသည်...</span>
                    </>
                  ) : detectedInView ? (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5" />
                      <span>ဤကုဒ်အား အတည်ပြုထည့်သွင်းမည် (Use Code)</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4.5 w-4.5" />
                      <span>Scan ဖတ်မည် (Capture Barcode)</span>
                    </>
                  )
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Embedded laser CSS */}
      <style>{`
        @keyframes scan-laser {
          0%, 100% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
