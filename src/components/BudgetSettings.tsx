import React, { useState } from 'react';
import { Transaction, Budget, DEFAULT_BANGLA_CATEGORIES } from '../types';
import { translations, formatCurrency } from '../utils/translations';
import { Check, ShieldAlert, Award, TrendingDown, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface BudgetSettingsProps {
  generalBudget: number;
  categoryBudgets: Budget[];
  onSaveGeneralBudget: (limit: number) => void;
  onSaveCategoryBudget: (category: string, limit: number) => void;
  transactions: Transaction[];
  language: 'bn' | 'en';
}

export default function BudgetSettings({
  generalBudget,
  categoryBudgets,
  onSaveGeneralBudget,
  onSaveCategoryBudget,
  transactions,
  language
}: BudgetSettingsProps) {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'general' | 'categories'>('general');
  const [genBudgetInput, setGenBudgetInput] = useState<string>(generalBudget.toString());
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_BANGLA_CATEGORIES.expense[0].label);
  const [catBudgetInput, setCatBudgetInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Calculate total monthly expense in current month
  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentMonthExpenses = transactions
    .filter(tr => tr.type === 'expense' && tr.date.startsWith(currentYearMonth));
  
  const totalMonthExpense = currentMonthExpenses.reduce((sum, tr) => sum + tr.amount, 0);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(genBudgetInput) || 0;
    onSaveGeneralBudget(limit);
    showSuccess();
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    const limit = parseFloat(catBudgetInput) || 0;
    onSaveCategoryBudget(selectedCategory, limit);
    setCatBudgetInput('');
    showSuccess();
  };

  const showSuccess = () => {
    setSuccessMsg(language === 'bn' ? 'বাজেট সফলভাবে সেট করা হয়েছে!' : 'Budget updated successfully!');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // Get budget limits for rendering list
  const activeExpenseCats = DEFAULT_BANGLA_CATEGORIES.expense;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800/80 transition-colors duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Target className="text-sky-500 dark:text-sky-400" size={24} />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {t.budget}
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mb-6 border border-slate-200/50 dark:border-slate-850">
        <button
          id="budget-tab-general"
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-705'
          }`}
        >
          {t.generalBudget}
        </button>
        <button
          id="budget-tab-categories"
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-705'
          }`}
        >
          {t.categoryBudget}
        </button>
      </div>

      {/* Message overlay */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-xl flex items-center gap-2"
        >
          <Check size={18} />
          {successMsg}
        </motion.div>
      )}

      {/* Tab views */}
      {activeTab === 'general' ? (
        <div className="space-y-6">
          <form onSubmit={handleSaveGeneral} className="flex flex-col gap-3">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {t.generalBudget} ({t.currency})
            </label>
            <div className="flex gap-2">
              <input
                id="general-budget-input"
                type="number"
                min="0"
                value={genBudgetInput}
                onChange={(e) => setGenBudgetInput(e.target.value)}
                placeholder="যেমন: ১৫০০০"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all font-semibold"
              />
              <button
                id="btn-save-general-budget"
                type="submit"
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl cursor-pointer shadow-lg shadow-sky-500/15 transition-all text-sm active:scale-95"
              >
                {t.save}
              </button>
            </div>
          </form>

          {/* Current global budget utilization bar */}
          {generalBudget > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/80">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t.budgetStatus}
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(totalMonthExpense, language === 'bn')} / {formatCurrency(generalBudget, language === 'bn')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    totalMonthExpense > generalBudget
                      ? 'bg-red-500'
                      : totalMonthExpense > generalBudget * 0.85
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalMonthExpense / generalBudget) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-3 text-xs">
                {totalMonthExpense > generalBudget ? (
                  <p className="text-red-500 dark:text-red-400 font-bold flex items-center gap-1">
                    <ShieldAlert size={14} /> {t.budgetExceeded}
                  </p>
                ) : totalMonthExpense > generalBudget * 0.85 ? (
                  <p className="text-amber-500 dark:text-amber-400 font-bold flex items-center gap-1">
                    <ShieldAlert size={14} /> {t.budgetWarning}
                  </p>
                ) : (
                  <p className="text-emerald-500 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Award size={14} /> {language === 'bn' ? 'আপনি বাজেটের ভিতরে সুরক্ষিত আছেন!' : 'Safe under your budget limit!'}
                  </p>
                )}
                <span className="text-slate-400 font-semibold">
                  {Math.round((totalMonthExpense / generalBudget) * 100)}% {language === 'bn' ? 'খরচ হয়েছে' : 'spent'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.category}
              </label>
              <select
                id="budget-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all font-semibold cursor-pointer"
              >
                {activeExpenseCats.map((cat) => (
                  <option key={cat.id} value={cat.label}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.amount} ({t.currency})
              </label>
              <div className="flex gap-2">
                <input
                  id="category-budget-input"
                  type="number"
                  min="0"
                  value={catBudgetInput}
                  onChange={(e) => setCatBudgetInput(e.target.value)}
                  placeholder="যেমন: ৩০০০"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none transition-all font-semibold"
                />
                <button
                  id="btn-save-category-budget"
                  type="submit"
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl cursor-pointer shadow-lg shadow-sky-500/15 transition-all text-sm active:scale-95"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </form>

          {/* List of configured Category Budgets */}
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2">
              {language === 'bn' ? 'সেট করা ক্যাটাগরি বাজেটসমূহ' : 'Sectors Budget Allocation'}
            </h3>
            {categoryBudgets.length === 0 ? (
              <p className="text-sm text-slate-405 dark:text-slate-500 italic text-center py-2">
                {language === 'bn' ? 'কোনো নির্দিষ্ট খাতভিত্তিক বাজেট সেট করা হয়নি।' : 'No category budgets configured yet.'}
              </p>
            ) : (
              <div className="max-h-[220px] overflow-y-auto pr-1 space-y-3">
                {categoryBudgets.map((bud, idx) => {
                  const catColor = activeExpenseCats.find(c => c.label === bud.category)?.color || '#94A3B8';
                  
                  // Calculate actual spent in this category
                  const spent = currentMonthExpenses
                      .filter(tr => tr.category === bud.category)
                      .reduce((sum, tr) => sum + tr.amount, 0);
                  const isExceeded = spent > bud.limit;
                  const ratio = Math.min(100, (spent / bud.limit) * 100);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }} />
                          {bud.category.split(' (')[0]}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {formatCurrency(spent, language === 'bn')} / {formatCurrency(bud.limit, language === 'bn')}
                        </span>
                      </div>

                      {/* Mini bar indicator */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isExceeded ? 'bg-red-500' : ratio > 85 ? 'bg-amber-500' : 'bg-sky-500'}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>

                      {/* Warning micro elements */}
                      {isExceeded && (
                        <span className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <TrendingDown size={11} /> {language === 'bn' ? 'বাজেট লিমিট বাড়ে গেছে!' : 'Budget limit exceeded!'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
