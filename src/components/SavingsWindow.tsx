import React, { useState } from 'react';
import { SavingsGoal } from '../types';
import { formatCurrency, toBanglaDigits } from '../utils/translations';
import { 
  PiggyBank, Target, Calendar, Plus, Minus, Trash2, Award, 
  TrendingUp, CircleDollarSign, CheckCircle2, ChevronRight, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SavingsWindowProps {
  goals: SavingsGoal[];
  onSaveGoal: (goal: Omit<SavingsGoal, 'id'> & { id?: string }) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoalAmount: (id: string, newAmount: number) => void;
  language: 'bn' | 'en';
}

export default function SavingsWindow({
  goals,
  onSaveGoal,
  onDeleteGoal,
  onUpdateGoalAmount,
  language
}: SavingsWindowProps) {
  // Navigation & Sub-states
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Quick Deposit/Withdraw states per goal
  const [activeActionGoalId, setActiveActionGoalId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [actionVal, setActionVal] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');

  // Summary Metrics
  const totalSavings = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTargets = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const averageProgress = totalTargets > 0 ? (totalSavings / totalTargets) * 100 : 0;
  const completedGoalsCount = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const isBn = language === 'bn';

  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setNotes('');
    setFormError('');
    setShowAddForm(false);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError(isBn ? 'দয়া করে সঞ্চয় লক্ষ্যের নামটি লিখুন!' : 'Please enter savings goal name!');
      return;
    }

    const tAmt = parseFloat(targetAmount);
    if (isNaN(tAmt) || tAmt <= 0) {
      setFormError(isBn ? 'টার্গেট টাকার পরিমাণ অবশ্যই ০ থেকে বেশি হতে হবে!' : 'Target amount must be greater than 0!');
      return;
    }

    const cAmt = currentAmount ? parseFloat(currentAmount) : 0;
    if (isNaN(cAmt) || cAmt < 0) {
      setFormError(isBn ? 'ইতিমধ্যে জমানো টাকা শূন্য বা ধনাত্মক হতে হবে!' : 'Already saved amount must be a valid number!');
      return;
    }

    if (cAmt > tAmt) {
      setFormError(isBn ? 'জমানো টাকা টার্গেট টাকার চেয়ে বেশি হতে পারবে না!' : 'Current savings cannot exceed the target!');
      return;
    }

    if (!targetDate) {
      setFormError(isBn ? 'দয়া করে টার্গেট তারিখ নির্বাচন করুন!' : 'Please select target completion date!');
      return;
    }

    onSaveGoal({
      title: title.trim(),
      targetAmount: tAmt,
      currentAmount: cAmt,
      targetDate,
      notes: notes.trim()
    });

    resetForm();
  };

  const handleActionSubmit = (e: React.FormEvent, goal: SavingsGoal) => {
    e.preventDefault();
    setActionError('');

    const val = parseFloat(actionVal);
    if (isNaN(val) || val <= 0) {
      setActionError(isBn ? 'সঠিক টাকার পরিমাণ প্রবেশ করুন!' : 'Please enter a valid amount!');
      return;
    }

    if (actionType === 'deposit') {
      const updated = goal.currentAmount + val;
      onUpdateGoalAmount(goal.id, updated);
    } else {
      const updated = goal.currentAmount - val;
      if (updated < 0) {
        setActionError(isBn ? 'লক্ষ্যে জমানো টাকার চেয়ে বেশি টাকা উঠানো সম্ভব নয়!' : 'Cannot withdraw more than what is saved!');
        return;
      }
      onUpdateGoalAmount(goal.id, updated);
    }

    // Reset action state
    setActiveActionGoalId(null);
    setActionVal('');
  };

  // Human Date formatting
  const formatDateBn = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      const day = d.getDate();
      const months = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const year = d.getFullYear();
      return `${toBanglaDigits(day, true)} ${months[d.getMonth()]} ${toBanglaDigits(year, true)}`;
    } catch {
      return dateString;
    }
  };

  const formatDateEn = (dateString: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-left">
      
      {/* 1. Header Banner & Quick Stats */}
      <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
              <PiggyBank size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">
                {isBn ? 'সঞ্চয় উইন্ডো (Savings Corner)' : 'Savings Corner'}
              </h2>
              <p className="text-xs text-white/80 font-medium">
                {isBn ? 'ভবিষ্যতের সুন্দর ও সুরক্ষিত অর্থনৈতিক জীবনের সঞ্চয় লক্ষ্য রাখুন' : 'Plan and track your money goals to secure your financial future'}
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4.5 py-2.5 bg-white text-sky-700 hover:bg-sky-50 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 self-start sm:self-center"
          >
            <Plus size={16} />
            {isBn ? 'নতুন সঞ্চয় লক্ষ্য' : 'New Savings Goal'}
          </button>
        </div>

        {/* Triple micro metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/15 pt-5">
          <div className="space-y-1">
            <span className="text-[10px] text-white/70 font-black uppercase tracking-wider block">
              {isBn ? 'মোট জমানো টাকা' : 'Total Money Saved'}
            </span>
            <span className="text-2xl font-black">
              {formatCurrency(totalSavings, isBn)}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-white/70 font-black uppercase tracking-wider block">
              {isBn ? 'লক্ষ্য পূরণ' : 'Goals Completed'}
            </span>
            <span className="text-2xl font-black flex items-center gap-1.5">
              {isBn ? `${toBanglaDigits(completedGoalsCount, true)} / ${toBanglaDigits(goals.length, true)}` : `${completedGoalsCount} of ${goals.length}`}
              {completedGoalsCount > 0 && completedGoalsCount === goals.length && (
                <Award size={20} className="text-yellow-350 animate-bounce" />
              )}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-white/70 font-black uppercase tracking-wider block">
              {isBn ? 'গড় অগ্রগতি' : 'Average Goal Progress'}
            </span>
            <span className="text-2xl font-black">
              {isBn ? toBanglaDigits(Math.round(averageProgress), true) : Math.round(averageProgress)}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Add Goal Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-md border border-slate-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                {isBn ? '🎯 নতুন সঞ্চয় লক্ষ্য নির্ধারণ করুন' : '🎯 Create a New Savings Objective'}
              </h3>
              <button
                type="button"
                onClick={resetForm}
                className="text-slate-400 hover:text-rose-500 font-extrabold text-xs cursor-pointer flex items-center gap-0.5"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-650 dark:text-red-400 text-xs font-semibold">
                ⚠ {formError}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400">
                    {isBn ? 'লক্ষ্যের নাম (যেমন: বাড়ি কেনা, উপহার)' : 'Goal Title (e.g. Dream Laptop, Emergency)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={isBn ? 'সঞ্চয়ের উদ্দেশ্য লিখুন...' : 'Enter target saving goal title...'}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Target Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400">
                    {isBn ? 'লক্ষ্যমাত্রা (টার্গেট টাকা)' : 'Target Savings Amount'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Already Saved Amount */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400">
                    {isBn ? 'ইতিমধ্যে কত টাকা জমা আছে?' : 'Already Saved (Starting Amount)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Target Date */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-500 dark:text-slate-400">
                    {isBn ? 'কবে নাগাদ পূরণ করতে চান? (তারিখ)' : 'Target Date to Complete'}
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-slate-400">
                  {isBn ? 'সংক্ষিপ্ত চিরকুট বা নোট (অনচ্ছিক)' : 'Brief Description / Notes (Optional)'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isBn ? 'যেমন: ডিপিএস অ্যাকাউন্ট, ট্রাস্ট ব্যাংক' : 'e.g., DPS target, monthly fixed transfer'}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 text-xs font-black rounded-lg cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-500 text-white hover:bg-sky-600 text-xs font-black rounded-lg cursor-pointer flex items-center gap-1 shadow-md"
                >
                  <Target size={14} />
                  {isBn ? 'ঠিক করুন' : 'Confirm Goal'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Render Savings Goals Card Collection List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850">
            <HelpCircle size={40} className="text-sky-300 dark:text-slate-600 mx-auto mb-3 animate-pulse" />
            <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
              {isBn ? 'কোনো সঞ্চয় লক্ষ্য নির্ধারিত নেই!' : 'No savings goals configured yet!'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto font-medium">
              {isBn 
                ? 'উপরের "নতুন সঞ্চয় লক্ষ্য" বাটনে ক্লিক করে টাকা জমানোর চমৎকার লক্ষ্য সাজিয়ে নিন এবং নিয়মিত অগ্রগতি ট্র্যাক করুন।'
                : 'Click "New Savings Goal" above to configure target amounts and dates, then start accumulating wealth step by step.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {goals.map((goal) => {
              const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const isFormActive = activeActionGoalId === goal.id;

              return (
                <div
                  key={goal.id}
                  className={`p-5 bg-white dark:bg-slate-900 border rounded-3xl transition-all shadow-sm relative overflow-hidden flex flex-col justify-between space-y-4 ${
                    isCompleted 
                      ? 'border-emerald-250 dark:border-emerald-950/40 ring-1 ring-emerald-500/10' 
                      : 'border-slate-100 dark:border-slate-850/80 hover:border-slate-200'
                  }`}
                >
                  {/* Goal header detail */}
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                        ) : (
                          <div className="p-1.5 bg-sky-50 dark:bg-sky-500/10 text-sky-500 rounded-lg flex-shrink-0">
                            <Target size={14} />
                          </div>
                        )}
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {goal.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(isBn ? 'আপনি কি আসলেই এই সঞ্চয় লক্ষ্যটি মুছে ফেলতে চান?' : 'Delete this savings goal?')) {
                            onDeleteGoal(goal.id);
                          }
                        }}
                        title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                        className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {goal.notes && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 italic pl-1 leading-snug">
                        💡 {goal.notes}
                      </p>
                    )}
                  </div>

                  {/* Graphic Progress metrics */}
                  <div className="space-y-2 select-none">
                    <div className="flex justify-between items-end text-[11px] font-extrabold">
                      <span className="text-slate-650 dark:text-slate-40y">
                        {isBn ? 'অগ্রগতি:' : 'Progress:'} <span className={isCompleted ? 'text-emerald-500' : 'text-sky-500'}>{isBn ? toBanglaDigits(Math.round(progress), true) : Math.round(progress)}%</span>
                      </span>
                      <span className="text-slate-400">
                        {formatCurrency(goal.currentAmount, isBn)} / {formatCurrency(goal.targetAmount, isBn)}
                      </span>
                    </div>

                    {/* Bar container */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-50 dark:border-slate-850/80">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                            : 'bg-gradient-to-r from-sky-400 to-sky-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Expected Date status */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar size={11} />
                      <span>{isBn ? 'টার্গেট তারিখ:' : 'DeadlineDate:'} {isBn ? formatDateBn(goal.targetDate) : formatDateEn(goal.targetDate)}</span>
                    </div>
                  </div>

                  {/* Fund interactive Adjuster Panel */}
                  <div className="border-t border-slate-50 dark:border-slate-850 pt-3 flex flex-col gap-2">
                    {!isFormActive ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActionGoalId(goal.id);
                            setActionType('deposit');
                          }}
                          className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-450 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 border border-emerald-500/10 focus:outline-none"
                        >
                          <Plus size={12} />
                          {isBn ? 'টাকা রাখুন' : 'Save Money'}
                        </button>

                        <button
                          type="button"
                          disabled={goal.currentAmount <= 0}
                          onClick={() => {
                            setActiveActionGoalId(goal.id);
                            setActionType('withdraw');
                          }}
                          className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/15 text-rose-500 dark:text-rose-450 text-[11px] font-black rounded-xl transition-all cursor-disabled disabled:opacity-40 flex items-center justify-center gap-1 border border-rose-500/10 focus:outline-none"
                        >
                          <Minus size={12} />
                          {isBn ? 'টাকা তুলুন' : 'Withdraw'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleActionSubmit(e, goal)} className="space-y-2 animate-fade-in text-left">
                        {actionError && (
                          <div className="text-[10px] text-rose-500 font-bold">
                            {actionError}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">
                              {isBn ? '৳' : '$'}
                            </span>
                            <input
                              type="number"
                              required
                              min="0.1"
                              step="any"
                              value={actionVal}
                              onChange={(e) => setActionVal(e.target.value)}
                              placeholder="0.0"
                              className="w-full pl-6 pr-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs font-bold outline-none"
                            />
                          </div>
                          
                          <button
                            type="submit"
                            className={`px-3.5 py-1.5 text-white font-extrabold text-xs rounded-lg cursor-pointer ${
                              actionType === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                            }`}
                          >
                            {actionType === 'deposit' ? (isBn ? 'রাখুন' : 'Add') : (isBn ? 'তুলুন' : 'Deduct')}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setActiveActionGoalId(null);
                              setActionVal('');
                              setActionError('');
                            }}
                            className="px-2 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-350 text-xs rounded-lg cursor-pointer"
                          >
                            {isBn ? 'বাতিল' : 'Cancel'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Mini saving guidelines */}
      <div className="p-4 bg-indigo-500/5 dark:bg-slate-905-5/20 border border-indigo-400/15 rounded-2xl flex items-start gap-3">
        <TrendingUp size={20} className="text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">
            {isBn ? '💡 জমানোর সুবর্ণ সূত্র (50/30/20 Rule)' : '💡 Golden Pro saving hack (50/30/20 rule)'}
          </h5>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1 font-semibold">
            {isBn 
              ? 'আপনার মোট আয়ের ৫০% অত্যাবশ্যক ব্যয়ের কাজে (বাজার, বাড়ি ভাড়া), ৩০% ইচ্ছা পূরণের জন্য (শখের খাবার, কেনাকাটা) রাখুন এবং ন্যূনতম ২০% নিয়মিত এই সঞ্চয় উইন্ডোতে জমা করার মাধ্যমে চমৎকার ভবিষ্যতের ভিত্তি তৈরি করুন।'
              : 'Allocate 50% of your earnings to absolute essentials (like groceries, house rents), 30% to optional desires (like fast food, hobbies) and safely put at least 20% into this savings corner.'}
          </p>
        </div>
      </div>

    </div>
  );
}
