import { useState } from 'react';
import { Transaction, DEFAULT_BANGLA_CATEGORIES } from '../types';
import { translations, formatCurrency } from '../utils/translations';
import { PieChart, List, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { motion } from 'motion/react';

interface CategoryPieChartProps {
  transactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  language: 'bn' | 'en';
}

export default function CategoryPieChart({
  transactions,
  selectedMonth,
  language
}: CategoryPieChartProps) {
  const t = translations[language];
  const [activeType, setActiveType] = useState<'income' | 'expense'>('expense');

  // Filter transactions, either matching selectedMonth, or all if selectedMonth is empty
  const monthlyTransactions = transactions.filter((tr) => {
    if (!selectedMonth) return true;
    return tr.date.startsWith(selectedMonth);
  });

  const typeFiltered = monthlyTransactions.filter((tr) => tr.type === activeType);
  const totalAmount = typeFiltered.reduce((sum, tr) => sum + tr.amount, 0);

  // Group by category labels
  const categoryMap: { [key: string]: number } = {};
  typeFiltered.forEach((tr) => {
    categoryMap[tr.category] = (categoryMap[tr.category] || 0) + tr.amount;
  });

  // Convert to sorted lists
  const sortedStats = Object.entries(categoryMap)
    .map(([categoryLabel, amount]) => {
      // Find color in static definition
      const meta = DEFAULT_BANGLA_CATEGORIES[activeType].find(
        (c) => c.label === categoryLabel
      );
      return {
        category: categoryLabel,
        amount,
        percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
        color: meta?.color || '#94A3B8',
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // SVG Proportions for a beautiful donut layout
  let accumulatedPercent = 0;
  const donutSegments = sortedStats.map((stat) => {
    const startAngle = (accumulatedPercent / 100) * 360;
    const sizeAngle = (stat.percentage / 100) * 360;
    accumulatedPercent += stat.percentage;

    // Calculate arc math
    const radius = 50;
    const strokeDash = (stat.percentage / 100) * (2 * Math.PI * radius);
    const strokeOffset = ((100 - stat.percentage) / 100) * (2 * Math.PI * radius);

    return {
      ...stat,
      strokeDash,
      strokeOffset,
      startAngle,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800/80 transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <PieChart className="text-sky-500 dark:text-sky-450" size={24} />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {t.categoryWise}
          </h2>
        </div>

        {/* Toggle Income / Expense View */}
        <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850-85">
          <button
            id="chart-tab-expense"
            type="button"
            onClick={() => setActiveType('expense')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeType === 'expense'
                ? 'bg-rose-500 text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-705'
            }`}
          >
            {t.expense}
          </button>
          <button
            id="chart-tab-income"
            type="button"
            onClick={() => setActiveType('income')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
              activeType === 'income'
                ? 'bg-emerald-500 text-white shadow-sm font-black'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-705'
            }`}
          >
            {t.income}
          </button>
        </div>
      </div>

      {sortedStats.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-slate-50 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600 rounded-full mb-3 border border-slate-100 dark:border-slate-850/40 animate-pulse">
            <Layers size={36} />
          </div>
          <p className="text-slate-400 dark:text-slate-500 italic text-sm">
            {activeType === 'expense' 
              ? (language === 'bn' ? 'চলতি মাসে কোনো খরচের খাত পাওয়া যায়নি!' : 'No expense entries for this month!')
              : (language === 'bn' ? 'চলতি মাসে কোনো আয়ের খাত পাওয়া যায়নি!' : 'No income entries for this month!')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Donut Chart Visualizer */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="transparent"
                  stroke="#E2E8F0"
                  className="dark:stroke-slate-800"
                  strokeWidth="11"
                />
                
                {/* Cumulative segments representing sectors */}
                {donutSegments.map((seg, idx) => {
                  let rotate = 0;
                  // sum preceding angles
                  for (let i = 0; i < idx; i++) {
                    rotate += donutSegments[i].percentage;
                  }
                  const rotationVal = (rotate / 100) * 360;

                  return (
                    <motion.circle
                      key={idx}
                      cx="60"
                      cy="60"
                      r="50"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="12"
                      strokeDasharray={`${seg.strokeDash} ${2 * Math.PI * 50}`}
                      transform={`rotate(${rotationVal} 60 60)`}
                      className="transition-transform duration-500 ease-out hover:stroke-[14px]"
                      initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                      animate={{ strokeDashoffset: 0 }}
                      style={{ strokeLinecap: 'round' }}
                    />
                  );
                })}
              </svg>
              
              {/* Inner Circle Totals Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-405 dark:text-slate-500 tracking-wider">
                  {t.total} {activeType === 'income' ? t.income : t.expense}
                </span>
                <span className="text-base font-black text-slate-800 dark:text-slate-100">
                  {formatCurrency(totalAmount, language === 'bn')}
                </span>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-1">
                  {donutSegments.length} {language === 'bn' ? 'টি খাত' : 'sectors'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats detailed legend list */}
          <div className="md:col-span-7 space-y-4">
            {sortedStats.map((stat, idx) => {
              // Strip standard parts of the category name
              const cleanLabel = stat.category.split(' (')[0];

              return (
                <div key={idx} className="space-y-1">
                  
                  {/* Category Title & Amount */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                      <span className="w-3 h-3 rounded-md animate-none" style={{ backgroundColor: stat.color }} />
                      {cleanLabel}
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {formatCurrency(stat.amount, language === 'bn')} 
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-normal ml-1">
                        ({Math.round(stat.percentage)}%)
                      </span>
                    </span>
                  </div>

                  {/* Horizontal Bar progress */}
                  <div className="w-full bg-slate-100 dark:bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-200/20 dark:border-slate-850">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
