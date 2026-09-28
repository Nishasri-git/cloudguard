import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Play,
  Loader2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { runScan, validateJson, fetchSampleData } from '../services/api';
import { ScanResult } from '../types/security';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanCompleted: (result: ScanResult) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onScanCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');
  const [scanName, setScanName] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    resourceCount?: number;
    resourceTypes?: string[];
    error?: string;
  } | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setScanName(file.name.replace(/\.[^/.]+$/, "") + " Audit");

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      handleValidate(content);
    };
    reader.readAsText(file);
  };

  const handleValidate = async (contentToValidate?: string) => {
    const content = contentToValidate !== undefined ? contentToValidate : jsonInput;
    if (!content.trim()) {
      setValidationResult({ valid: false, error: 'Configuration JSON is empty.' });
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateJson(content);
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({ valid: false, error: err.message || 'Validation request failed' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      const sample = await fetchSampleData();
      const str = JSON.stringify(sample, null, 2);
      setJsonInput(str);
      setScanName("Acme Multi-Cloud Production Baseline");
      setFileName("sample-multicloud-config.json");
      handleValidate(str);
    } catch (err) {
      console.error('Failed to load sample config:', err);
    }
  };

  const handleStartScan = async () => {
    if (!jsonInput.trim()) {
      setValidationResult({ valid: false, error: 'Please enter or upload a valid JSON cloud configuration.' });
      return;
    }

    setIsScanning(true);
    setScanStep('Parsing and discovering cloud resources...');

    try {
      let parsedConfig: any;
      try {
        parsedConfig = JSON.parse(jsonInput);
      } catch (e: any) {
        setValidationResult({ valid: false, error: `Invalid JSON syntax: ${e.message}` });
        setIsScanning(false);
        return;
      }

      await new Promise(r => setTimeout(r, 400));
      setScanStep('Normalizing configurations across providers...');
      await new Promise(r => setTimeout(r, 400));
      setScanStep('Executing deterministic CIS/NIST security rule engine...');

      const result = await runScan({
        config: parsedConfig,
        name: scanName.trim() || 'Custom Cloud Infrastructure Audit',
        useSample: false,
      });

      await new Promise(r => setTimeout(r, 300));
      setScanStep('Calculating transparent risk scores...');

      onScanCompleted(result);
      onClose();
    } catch (err: any) {
      setValidationResult({ valid: false, error: err.message || 'Scan execution failed' });
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Scan Cloud Configuration</h3>
              <p className="text-xs text-slate-400">Upload or paste JSON configuration for automated risk assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isScanning}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Scan Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Assessment Name
            </label>
            <input
              type="text"
              value={scanName}
              onChange={(e) => setScanName(e.target.value)}
              placeholder="e.g., Production AWS/Azure Baseline Audit"
              disabled={isScanning}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-sans"
            />
          </div>

          {/* Mode Switch & Load Sample */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Paste JSON
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Upload File (.json)
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoadSample}
              disabled={isScanning}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
            >
              <Play className="w-3 h-3 fill-amber-400/40" />
              <span>Load Sample Configuration</span>
            </button>
          </div>

          {/* Tab 1: Paste JSON */}
          {activeTab === 'paste' ? (
            <div>
              <div className="relative">
                <textarea
                  rows={8}
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    if (validationResult) setValidationResult(null);
                  }}
                  disabled={isScanning}
                  placeholder={`{\n  "resources": [\n    {\n      "id": "s3-prod-customer-data",\n      "type": "aws_s3_bucket",\n      "public_access": true,\n      "encryption": false\n    }\n  ]\n}`}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>
          ) : (
            /* Tab 2: File Upload */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-950/60 cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileCode className="w-10 h-10 text-cyan-400 mb-2 opacity-80" />
              <div className="text-sm font-semibold text-slate-200">
                {fileName ? fileName : 'Click to upload or drag & drop JSON'}
              </div>
              <p className="text-xs text-slate-400 mt-1">Accepts standard JSON cloud exports or Terraform state</p>
            </div>
          )}

          {/* Validation Feedback */}
          {validationResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                validationResult.valid
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-red-950/30 border-red-500/30 text-red-200'
              }`}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                {validationResult.valid ? (
                  <div>
                    <div className="font-semibold text-emerald-300">Valid Configuration Detected</div>
                    <div className="text-[11px] text-emerald-400/90 mt-0.5">
                      Ready to assess {validationResult.resourceCount} resource(s) across: {validationResult.resourceTypes?.join(', ')}.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-red-300">Validation Error</div>
                    <div className="text-[11px] text-red-400/90 mt-0.5">{validationResult.error}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scanning Progress Overlay */}
          {isScanning && (
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
              <div>
                <div className="text-xs font-semibold text-white">Running Security Assessment</div>
                <div className="text-[11px] text-cyan-300 font-mono animate-pulse">{scanStep}</div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleValidate()}
            disabled={isScanning || !jsonInput.trim()}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isValidating ? 'Validating...' : 'Validate JSON'}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isScanning}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isScanning || !jsonInput.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30 hover:shadow-cyan-600/50 transition-all cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Assets...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
