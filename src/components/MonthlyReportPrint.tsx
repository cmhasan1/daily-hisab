import { useState } from 'react';
import { Transaction, DEFAULT_BANGLA_CATEGORIES } from '../types';
import { translations, formatCurrency, getMonthNameBn, getMonthNameEn, toBanglaDigits } from '../utils/translations';
import { Printer, Download, X, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { motion } from 'motion/react';

interface MonthlyReportPrintProps {
  transactions: Transaction[];
  onClose: () => void;
  language: 'bn' | 'en';
}

export default function MonthlyReportPrint({
  transactions,
  onClose,
  language
}: MonthlyReportPrintProps) {
  const t = translations[language];

  // Pick month and year to generate report for
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(currentMonthStr);

  const selectedYear = selectedMonthStr.split('-')[0];
  const selectedMonthNum = parseInt(selectedMonthStr.split('-')[1]) - 1;
  const selectedMonthName = language === 'bn' 
    ? getMonthNameBn(selectedMonthNum) 
    : getMonthNameEn(selectedMonthNum);

  // Filter transactions for chosen month
  const reportTransactions = transactions
    .filter(tr => tr.date.startsWith(selectedMonthStr))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculates totals
  const totalIncome = reportTransactions
    .filter(tr => tr.type === 'income')
    .reduce((sum, tr) => sum + tr.amount, 0);

  const totalExpense = reportTransactions
    .filter(tr => tr.type === 'expense')
    .reduce((sum, tr) => sum + tr.amount, 0);

  const balance = totalIncome - totalExpense;

  // Sector totals
  const sectorMap: { [key: string]: { amount: number; type: string } } = {};
  reportTransactions.forEach(tr => {
    if (!sectorMap[tr.category]) {
      sectorMap[tr.category] = { amount: 0, type: tr.type };
    }
    sectorMap[tr.category].amount += tr.amount;
  });

  const triggerSystemPrint = () => {
    // Add print utility classes temporarly if needed, but standard print rules can target '#printable-report-wrapper' directly
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 md:p-6">
      {/* Container Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] border border-gray-100 dark:border-gray-800 transition-colors">
        
        {/* Editor controls bar - hidden during @media print */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between no-print bg-gray-50 dark:bg-gray-900/60 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <FileText className="text-teal-600 dark:text-teal-400" size={24} />
            <h2 className="text-base font-extrabold text-gray-800 dark:text-gray-100">
              {t.monthlyReport} {language === 'bn' ? 'তৈরি করুন' : 'Generator'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Choose Month */}
            <div className="flex items-center gap-1.5">
              <Calendar size={16} className="text-gray-400" />
              <input
                id="report-month-picker"
                type="month"
                value={selectedMonthStr}
                onChange={(e) => setSelectedMonthStr(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-750 bg-white dark:bg-gray-850 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Print Action button */}
            <button
              id="btn-print-pdf"
              onClick={triggerSystemPrint}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Printer size={15} />
              {language === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print & Download PDF'}
            </button>

            {/* Close button */}
            <button
              id="btn-close-report-print"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas Area */}
        <div 
          id="printable-report-wrapper" 
          className="flex-1 p-8 md:p-12 overflow-y-auto bg-white text-gray-900 selection:bg-teal-100 print:overflow-visible print:p-0 print:m-0"
        >
          {/* Header metadata */}
          <div className="border-b-2 border-teal-600 pb-6 mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-extrabold text-teal-800 tracking-tight">
                {t.appName} - {t.reportTitle}
              </h1>
              <p className="text-sm font-semibold text-gray-500 mt-1">
                {language === 'bn' ? 'মাস ও বছর:' : 'Period:'} {selectedMonthName}, {toBanglaDigits(selectedYear, language === 'bn')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {language === 'bn' ? 'রিপোর্ট তৈরির তারিখ:' : 'Generated on:'} {toBanglaDigits(new Date().toISOString().slice(0, 10), language === 'bn')}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-teal-600 font-black text-xl tracking-wide flex items-center gap-1 justify-end">
                <span>{t.appName}</span>
              </div>
              <p className="text-[11px] text-gray-400 italic">
                {language === 'bn' ? '১০০% অফলাইন এবং সুরক্ষিত লেজার' : '100% Secure Offline General Ledger'}
              </p>
            </div>
          </div>

          {/* Core Monthly balance sheet columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 print:grid-cols-3 print:gap-4">
            
            {/* Total Income */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-bold uppercase">{t.monthlyIncome}</p>
                <p className="text-xl font-extrabold text-emerald-800 mt-1">
                  {formatCurrency(totalIncome, language === 'bn')}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-full">
                <ArrowUpRight size={20} />
              </div>
            </div>

            {/* Total Expense */}
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-rose-600 font-bold uppercase">{t.monthlyExpense}</p>
                <p className="text-xl font-extrabold text-rose-800 mt-1">
                  {formatCurrency(totalExpense, language === 'bn')}
                </p>
              </div>
              <div className="p-2 bg-rose-100 text-rose-700 rounded-full">
                <ArrowDownRight size={20} />
              </div>
            </div>

            {/* Net Balance Balance sheet */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              balance >= 0 ? 'bg-teal-50 border-teal-100' : 'bg-amber-50 border-amber-100'
            }`}>
              <div>
                <p className="text-xs text-teal-700 font-bold uppercase">{t.balance}</p>
                <p className={`text-xl font-extrabold mt-1 ${balance >= 0 ? 'text-teal-800' : 'text-amber-800'}`}>
                  {formatCurrency(balance, language === 'bn')}
                </p>
              </div>
              <div className="p-2 bg-teal-100/60 text-teal-700 rounded-full">
                <DollarSign size={20} />
              </div>
            </div>

          </div>

          {/* Sector specific breakdowns */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider border-b border-gray-100 pb-1.5">
              {language === 'bn' ? 'খাতভিত্তিক সারসংক্ষেপ' : 'Sector Summary'}
            </h3>
            {Object.keys(sectorMap).length === 0 ? (
              <p className="text-xs text-gray-400 italic py-2">{t.noTransactions}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:grid-cols-2 print:gap-3">
                {Object.entries(sectorMap).map(([sector, data], index) => {
                  const isInc = data.type === 'income';
                  return (
                    <div key={index} className="flex justify-between items-center p-2.5 bg-gray-50 rounded-xl border border-gray-100/80">
                      <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isInc ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {sector.split(' (')[0]}
                      </span>
                      <span className={`text-xs font-extrabold ${isInc ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isInc ? '+' : '-'} {formatCurrency(data.amount, language === 'bn')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ledger details list */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 mb-3.5 uppercase tracking-wider border-b border-gray-100 pb-1.5">
              {language === 'bn' ? 'লেনদেনের বিস্তারিত বিবরণী' : 'Chronological Transactions Ledger'}
            </h3>
            
            {reportTransactions.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-8 text-center">{t.noTransactions}</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-center w-12">ক্র.নং</th>
                    <th className="py-2.5 px-3 text-xs font-bold text-gray-600">{t.date}</th>
                    <th className="py-2.5 px-3 text-xs font-bold text-gray-600">{t.category}</th>
                    <th className="py-2.5 px-3 text-xs font-bold text-gray-600">{t.description}</th>
                    <th className="py-2.5 px-3 text-xs font-bold text-gray-600 text-right">{t.amount}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportTransactions.map((tr, index) => {
                    const isIncome = tr.type === 'income';
                    return (
                      <tr key={tr.id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-3 text-xs text-gray-500 text-center">
                          {toBanglaDigits(index + 1, language === 'bn')}
                        </td>
                        <td className="py-3 px-3 text-xs font-semibold text-gray-700 whitespace-nowrap">
                          {toBanglaDigits(tr.date, language === 'bn')}
                        </td>
                        <td className="py-3 px-3 text-xs font-bold text-gray-800">
                          {tr.category.split(' (')[0]}
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-600 italic">
                          {tr.description || '—'}
                        </td>
                        <td className={`py-3 px-3 text-xs font-black text-right whitespace-nowrap ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isIncome ? '+' : '-'} {formatCurrency(tr.amount, language === 'bn')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Professional stamp footer footer */}
          <div className="mt-16 border-t border-gray-100 pt-6 flex justify-between text-xs text-gray-400 italic print:mt-12">
            <span>{language === 'bn' ? 'সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে তৈরি' : 'Generated automatically by Hisab Tracker'}</span>
            <span className="text-right">হিসাব কিতাব অ্যাপ - সুরক্ষিত ও অফলাইন</span>
          </div>

        </div>

      </div>
    </div>
  );
}
