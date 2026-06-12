import React, { useState, useMemo } from 'react';
import { Transaction, DEFAULT_BANGLA_CATEGORIES } from '../types';
import { translations, formatCurrency, getMonthNameBn, getMonthNameEn, toBanglaDigits } from '../utils/translations';
import { Calendar, Trash2, Edit2, Search, ArrowDownCircle, ArrowUpCircle, Filter, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  language: 'bn' | 'en';
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
  language
}: TransactionListProps) {
  const t = translations[language];

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(''); // YYYY-MM prefix or empty for all

  // Dynamic lists of unique custom Categories populated on the fly
  const activeCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(tr => list.add(tr.category));
    return Array.from(list);
  }, [transactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tr => {
      const matchSearch = 
        tr.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        tr.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'all' || tr.type === filterType;
      const matchCategory = filterCategory === 'all' || tr.category === filterCategory;
      const matchMonth = !filterMonth || tr.date.startsWith(filterMonth);

      return matchSearch && matchType && matchCategory && matchMonth;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest date first
  }, [transactions, searchTerm, filterType, filterCategory, filterMonth]);

  // Group filtered transactions by Date string (YYYY-MM-DD)
  const groupedTransactions: Record<string, Transaction[]> = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(tr => {
      if (!groups[tr.date]) {
        groups[tr.date] = [];
      }
      groups[tr.date].push(tr);
    });

    return groups;
  }, [filteredTransactions]);

  // Formatting date nicely in Bengali
  const formatDateBeautifully = (dateString: string): string => {
    try {
      const dateObj = new Date(dateString);
      const day = dateObj.getDate();
      const monthIdx = dateObj.getMonth();
      const year = dateObj.getFullYear();

      if (language === 'bn') {
        return `${toBanglaDigits(day, true)} ${getMonthNameBn(monthIdx)} ${toBanglaDigits(year, true)}`;
      } else {
        return `${day} ${getMonthNameEn(monthIdx)} ${year}`;
      }
    } catch (e) {
      return dateString;
    }
  };

  // Helper code to get specific date stats (total income & expense for that literal day)
  const calculateDailySum = (dailyList: Transaction[]) => {
    let income = 0;
    let expense = 0;
    dailyList.forEach(tr => {
      if (tr.type === 'income') income += tr.amount;
      else expense += tr.amount;
    });
    return { income, expense };
  };

  return (
    <div className="space-y-6">
      
      {/* Filtering Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800/80 transition-colors duration-300 space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-850 pb-3">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Filter size={16} className="text-sky-500 dark:text-sky-400" />
            {language === 'bn' ? 'ফিল্টার করুন ও খুঁজুন' : 'Filter Ledger'}
          </h3>
          
          {/* Quick Clear Button */}
          {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterMonth) && (
            <button
              id="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterCategory('all');
                setFilterMonth('');
              }}
              className="text-xs text-rose-500 font-bold hover:underline cursor-pointer"
            >
              {language === 'bn' ? 'সব মুছুন' : 'Reset All'}
            </button>
          )}
        </div>

        {/* Filters Select blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Search text */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
            <input
              id="list-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all font-semibold"
            />
          </div>

          {/* Filter Month */}
          <div className="relative">
            <input
              id="list-month-filter"
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Type dropdown */}
          <div className="relative">
            <select
              id="list-type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-250 outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="all">{t.allTypes}</option>
              <option value="income">💵 {t.income}</option>
              <option value="expense">💸 {t.expense}</option>
            </select>
          </div>

          {/* Category dropdown selector */}
          <div className="relative">
            <select
              id="list-category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-255 outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              <option value="all">{t.allSectors}</option>
              {activeCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat.split(' (')[0]}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Transaction Day Logs List */}
      <div className="space-y-5">
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-100 dark:border-slate-800/80 shadow-sm">
            <HelpCircle size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
            <p className="text-slate-400 dark:text-slate-500 font-medium italic text-sm">
              {t.noTransactions}
            </p>
          </div>
        ) : (
          /* Render grouped date blocks */
          Object.entries(groupedTransactions).map(([dateStr, items]) => {
            const { income, expense } = calculateDailySum(items);

            return (
              <motion.div
                key={dateStr}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100/95 dark:border-slate-800/80 overflow-hidden transition-all"
              >
                {/* Day Header Summary */}
                <div className="p-4 bg-slate-50 dark:bg-slate-955/40 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-sky-500 dark:text-sky-400" />
                    <span className="font-extrabold text-sm text-slate-850 dark:text-slate-100">
                      {formatDateBeautifully(dateStr)}
                    </span>
                  </div>

                  {/* Daily calculations block: see daily total income/expense */}
                  <div className="flex items-center gap-4 text-xs font-extrabold">
                    {income > 0 && (
                      <span className="text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold border border-emerald-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {language === 'bn' ? 'আয়:' : 'Income:'} {formatCurrency(income, language === 'bn')}
                      </span>
                    )}
                    {expense > 0 && (
                      <span className="text-rose-700 bg-rose-50 dark:bg-rose-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold border border-rose-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {language === 'bn' ? 'ব্যয়:' : 'Expense:'} {formatCurrency(expense, language === 'bn')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day ledger entries list items */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {items.map((tr) => {
                    const isIncome = tr.type === 'income';
                    const categoryMeta = DEFAULT_BANGLA_CATEGORIES[tr.type].find(c => c.label === tr.category);
                    const categoryBadgeColor = categoryMeta?.color || '#94A3B8';

                    return (
                      <div
                        key={tr.id}
                        id={`transaction-item-${tr.id}`}
                        className="p-4 hover:bg-slate-55/50 dark:hover:bg-slate-950/40 flex items-center justify-between gap-4 transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Type indicator colored orb */}
                          <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                            isIncome 
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-450'
                          }`}>
                            {isIncome ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                          </div>

                          <div className="min-w-0">
                            {/* Sector title */}
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate">
                                {tr.category.split(' (')[0]}
                              </span>
                              {/* Small vertical category strip */}
                              <span
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: categoryBadgeColor }}
                                title={tr.category}
                              />
                            </div>
                            {/* Note details */}
                            {tr.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate italic">
                                {tr.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Interactive Amount and modification controls */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className={`text-sm font-black whitespace-nowrap ${
                            isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {isIncome ? '+' : '-'} {formatCurrency(tr.amount, language === 'bn')}
                          </span>

                          {/* Trigger edit / delete buttons */}
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              id={`btn-edit-${tr.id}`}
                              onClick={() => onEdit(tr)}
                              title={t.editTransaction}
                              className="p-1.5 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              id={`btn-delete-${tr.id}`}
                              onClick={() => onDelete(tr.id)}
                              title={t.delete}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </motion.div>
            );
          })
        )}
      </div>

    </div>
  );
}
