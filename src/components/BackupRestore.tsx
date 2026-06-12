import React, { useState, useRef } from 'react';
import { Download, Upload, ShieldAlert, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toBanglaDigits, translations } from '../utils/translations';
import { Transaction, Budget, AppSettings } from '../types';

interface BackupRestoreProps {
  transactions: Transaction[];
  generalBudget: number;
  categoryBudgets: Budget[];
  appSettings: AppSettings;
  onImportDone: (data: {
    transactions: Transaction[];
    generalBudget: number;
    categoryBudgets: Budget[];
    appSettings: AppSettings;
  }) => void;
  language: 'bn' | 'en';
}

export default function BackupRestore({
  transactions,
  generalBudget,
  categoryBudgets,
  appSettings,
  onImportDone,
  language
}: BackupRestoreProps) {
  const t = translations[language];
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download all state as JSON
  const handleExportBackup = () => {
    try {
      const dataToSave = {
        version: "1.0.0",
        appIdent: "hisab_kitab_offline",
        exportedAt: new Date().toISOString(),
        transactions,
        generalBudget,
        categoryBudgets,
        appSettings
      };

      const jsonStr = JSON.stringify(dataToSave, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `hisab_kitab_backup_${dateStr}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(language === 'bn' ? 'ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!' : 'Backup downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(language === 'bn' ? 'ব্যাকআপ ফাইল তৈরিতে সমস্যা হয়েছে!' : 'Failed to generate backup!');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Upload/Restore file handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = event.target?.result as string;
        const parsed = JSON.parse(rawText);

        // Security check for valid schema
        if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
          throw new Error("Invalid schema: transactions missing");
        }

        onImportDone({
          transactions: parsed.transactions,
          generalBudget: typeof parsed.generalBudget === 'number' ? parsed.generalBudget : generalBudget,
          categoryBudgets: Array.isArray(parsed.categoryBudgets) ? parsed.categoryBudgets : categoryBudgets,
          appSettings: parsed.appSettings ? { ...appSettings, ...parsed.appSettings } : appSettings
        });

        setSuccess(t.importSuccess);
        setError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setSuccess(''), 4000);
      } catch (err) {
        setError(t.importError);
        setSuccess('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setError(''), 4000);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800/80 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="text-sky-500 dark:text-sky-450 animate-spin-slow" size={24} />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t.backupRestore}
        </h2>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
        {language === 'bn' 
          ? 'যেহেতু এই অ্যাপটি সম্পূর্ণ অফলাইন, তাই আপনার সমস্ত ডাটা আপনার ব্রাউজারে সংরক্ষিত থাকে। ফোন পরিবর্তন বা ব্রাউজার ক্লিয়ার করার আগে অবশ্যই একটি ব্যাকআপ ফাইল ডাউনলোড করে অন্য কোথাও সংরক্ষণ করুন।'
          : 'Since this app is entirely offline, your data stays strictly in your browser. Download copies regularly to avoid losing entries upon browser clears.'}
      </p>

      {/* Message alerts */}
      <AnimatePresence mode="wait">
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-xl flex items-center gap-2.5"
          >
            <Check size={18} />
            {success}
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-400 text-sm font-semibold rounded-xl flex items-center gap-2.5"
          >
            <ShieldAlert size={18} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export Card */}
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Download size={16} className="text-sky-550 dark:text-sky-400" />
              {t.backupTitle}
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              {t.backupDesc}
            </p>
          </div>
          <button
            id="btn-export-backup"
            onClick={handleExportBackup}
            className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-sky-550/15 active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {t.exportData}
          </button>
        </div>

        {/* Import Card */}
        <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              <Upload size={16} className="text-amber-500" />
              {t.restoreTitle}
            </h3>
            <p className="text-xs text-slate-400 leading-normal">
              {t.restoreDesc}
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              id="btn-trigger-import"
              onClick={triggerFileSelect}
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-amber-550/15 active:scale-95 flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {t.importData}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
