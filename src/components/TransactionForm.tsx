import React, { useState, useEffect } from 'react';
import { Transaction, DEFAULT_BANGLA_CATEGORIES, TransactionType } from '../types';
import { translations, toBanglaDigits } from '../utils/translations';
import { PlusCircle, Save, X, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
  language: 'bn' | 'en';
}

export default function TransactionForm({
  onSave,
  editingTransaction,
  onCancelEdit,
  language
}: TransactionFormProps) {
  const t = translations[language];

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  
  // Custom Sector options
  const [categoryChoice, setCategoryChoice] = useState<'preset' | 'custom'>('preset');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const currentCategoryList = DEFAULT_BANGLA_CATEGORIES[type];

  // Set initial selected category from preset list
  useEffect(() => {
    if (currentCategoryList.length > 0) {
      setSelectedCategory(currentCategoryList[0].label);
    }
  }, [type]);

  // Load transaction on editing
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setDescription(editingTransaction.description);
      
      // Check if it's a preset category or custom
      const isPreset = DEFAULT_BANGLA_CATEGORIES[editingTransaction.type].some(
        (c) => c.label === editingTransaction.category
      );

      if (isPreset) {
        setCategoryChoice('preset');
        setSelectedCategory(editingTransaction.category);
      } else {
        setCategoryChoice('custom');
        setCustomCategory(editingTransaction.category);
      }
    }
  }, [editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError(language === 'bn' ? 'দয়া করে সঠিক টাকার পরিমাণ প্রবেশ করুন!' : 'Please enter a valid amount!');
      return;
    }

    const finalCategory = categoryChoice === 'preset' ? selectedCategory : customCategory.trim();
    if (!finalCategory) {
      setValidationError(
        language === 'bn' ? 'দয়া করে ব্যয়ের খাত বা বিভাগের নাম লিখুন!' : 'Please select or name a sector!'
      );
      return;
    }

    onSave({
      type,
      amount: parsedAmount,
      category: finalCategory,
      date,
      description: description.trim()
    });

    // Reset simple form controls
    setAmount('');
    setCustomCategory('');
    setDescription('');
    if (currentCategoryList.length > 0) {
      setSelectedCategory(currentCategoryList[0].label);
    }
    setCategoryChoice('preset');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800/80 transition-all duration-300">
      
      <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-150 dark:border-slate-800">
        <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          {editingTransaction ? t.editTransaction : t.addTransaction}
        </h2>
        {editingTransaction && onCancelEdit && (
          <button
            id="btn-cancel-edit-form"
            onClick={onCancelEdit}
            className="p-1 px-2.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 cursor-pointer flex items-center gap-1"
          >
            <X size={14} /> {t.cancel}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Validation Errors banner */}
        {validationError && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold">
            {validationError}
          </div>
        )}

        {/* Transaction Type Toggles (Income vs Expense) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            id="form-toggle-expense"
            type="button"
            onClick={() => setType('expense')}
            className={`py-3.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer border text-center ${
              type === 'expense'
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 ring-2 ring-rose-400/30 dark:ring-0'
                : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            💸 {t.expense}
          </button>
          <button
            id="form-toggle-income"
            type="button"
            onClick={() => setType('income')}
            className={`py-3.5 rounded-xl font-extrabold text-sm transition-all cursor-pointer border text-center ${
              type === 'income'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-250 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-400/30 dark:ring-0'
                : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            💰 {t.income}
          </button>
        </div>

        {/* Input Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Amount field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{t.amount}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-base pointer-events-none">
                {t.currency}
              </span>
              <input
                id="form-amount-input"
                type="number"
                step="any"
                min="0.1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all font-bold"
              />
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{t.date}</label>
            <input
              id="form-date-input"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all font-bold"
            />
          </div>

        </div>

        {/* Categories Section - supports custom text or preset toggles */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/85">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-850">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {t.category}
            </span>
            <div className="flex gap-1.5 bg-slate-200 dark:bg-slate-850 p-0.5 rounded-lg">
              <button
                id="form-choice-preset"
                type="button"
                onClick={() => setCategoryChoice('preset')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  categoryChoice === 'preset'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {language === 'bn' ? 'তালিকা' : 'Preset List'}
              </button>
              <button
                id="form-choice-custom"
                type="button"
                onClick={() => setCategoryChoice('custom')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  categoryChoice === 'custom'
                    ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {language === 'bn' ? 'নিজে লিখুন' : 'Write Custom'}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {categoryChoice === 'preset' ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-hidden py-1"
              >
                {currentCategoryList.map((cat) => {
                  const isSelected = selectedCategory === cat.label;
                  return (
                    <button
                      key={cat.id}
                      id={`preset-cat-${cat.id}`}
                      type="button"
                      onClick={() => setSelectedCategory(cat.label)}
                      className={`py-2 px-2.5 text-xs font-bold text-left rounded-lg transition-transform outline-none cursor-pointer border active:scale-95 text-ellipsis overflow-hidden ${
                        isSelected
                          ? 'border-transparent text-white font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                      style={{ backgroundColor: isSelected ? cat.color : undefined }}
                    >
                      {cat.label.split(' (')[0]}
                    </button>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-1.5"
              >
                <input
                  id="form-custom-category-input"
                  type="text"
                  required={categoryChoice === 'custom'}
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder={language === 'bn' ? 'আলাদা খাতের নাম লিখুন ( যেমন: ডিপিএস, বাড়ি পাঠানো )' : 'Type customized sector name...'}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 outline-none font-semibold text-sm"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Extra Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{t.description}</label>
          <input
            id="form-desc-input"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={language === 'bn' ? 'যেমন: মে মাসের বাসা ভাড়া, দুপুরের লাঞ্চ বিল' : 'e.g., May rent payments, client fees'}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all text-sm font-semibold"
          />
        </div>

        {/* Action button */}
        <button
          id="btn-save-transaction"
          type="submit"
          className="w-full py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl shadow-lg shadow-sky-500/20 cursor-pointer transition-transform duration-100 active:scale-98 text-sm flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {t.save}
        </button>

      </form>
    </div>
  );
}
