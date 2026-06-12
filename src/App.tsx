import { useState, useEffect } from 'react';
import { Transaction, Budget, AppSettings, DEFAULT_BANGLA_CATEGORIES, SavingsGoal } from './types';
import { translations, formatCurrency } from './utils/translations';
import PinLock from './components/PinLock';
import BudgetSettings from './components/BudgetSettings';
import BackupRestore from './components/BackupRestore';
import CategoryPieChart from './components/CategoryPieChart';
import MonthlyReportPrint from './components/MonthlyReportPrint';
import TransactionForm from './components/TransactionForm';
import TransactionList from './components/TransactionList';
import SavingsWindow from './components/SavingsWindow';
import { 
  Sun as SunIcon, Moon as MoonIcon, Shield as ShieldIcon, ShieldCheck as ShieldCheckIcon, 
  FileSpreadsheet as FileSpreadsheetIcon, Sparkles as SparklesIcon, TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon, Wallet as WalletIcon, Calendar as CalendarIcon, AlertTriangle as AlertTriangleIcon,
  Smartphone as SmartphoneIcon, Cloud as CloudIcon, CloudOff as CloudOffIcon, X as XIcon
} from 'lucide-react';

const LOCAL_STORAGE_TRANSACTIONS = 'hisab_kitab_transactions';
const LOCAL_STORAGE_BUDGET = 'hisab_kitab_gen_budget';
const LOCAL_STORAGE_CAT_BUDGETS = 'hisab_kitab_cat_budgets';
const LOCAL_STORAGE_SETTINGS = 'hisab_kitab_settings';
const LOCAL_STORAGE_SAVINGS = 'hisab_kitab_savings';

// Cold-start seed data for beautiful onboarding visuals
const SEED_TRANSACTIONS = (): Transaction[] => {
  const now = new Date();
  const yearMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const dateToday = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const dateYesterday = new Date(now.getTime() - 86450000).toISOString().slice(0, 10);

  return [
    {
      id: 'seed-income-1',
      type: 'income',
      amount: 45000,
      category: DEFAULT_BANGLA_CATEGORIES.income[0].label, // Salary / বেতন
      date: `${yearMonth}-01`,
      description: 'মাসিক মূল বেতন (Salary)'
    },
    {
      id: 'seed-income-2',
      type: 'income',
      amount: 8500,
      category: DEFAULT_BANGLA_CATEGORIES.income[1].label, // Tuition / টিউশন ফি
      date: dateYesterday,
      description: 'বিকেলের টিউশনি সম্মানী'
    },
    {
      id: 'seed-expense-1',
      type: 'expense',
      amount: 15000,
      category: DEFAULT_BANGLA_CATEGORIES.expense[2].label, // House Rent / বাসা ভাড়া
      date: `${yearMonth}-02`,
      description: 'বাসা ভাড়া পরিশোধ'
    },
    {
      id: 'seed-expense-2',
      type: 'expense',
      amount: 4500,
      category: DEFAULT_BANGLA_CATEGORIES.expense[0].label, // Groceries / বাজার
      date: dateYesterday,
      description: 'মাসের কাঁচাবাজার ও গ্রোসারি'
    },
    {
      id: 'seed-expense-3',
      type: 'expense',
      amount: 1200,
      category: DEFAULT_BANGLA_CATEGORIES.expense[1].label, // Eating out / এক্সট্রা খাবার
      date: dateToday,
      description: 'রেস্টুরেন্টে রাতের খাবার বিল'
    }
  ];
};

export default function App() {
  // --- Persistent States ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [generalBudget, setGeneralBudget] = useState<number>(15000);
  const [categoryBudgets, setCategoryBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    language: 'bn',
    theme: 'light',
    pinEnabled: false,
    pinCode: '',
    monthlyBudget: 15000
  });

  // --- Runtime UI States ---
  const [activeTab, setActiveTab ] = useState<'dashboard' | 'savings'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showSecurityConfig, setShowSecurityConfig] = useState<boolean>(false);
  const [showBackupConfig, setShowBackupConfig] = useState<boolean>(false);
  const [onboardingSuccessFlag, setOnboardingSuccessFlag] = useState<string>('');

  // --- PWA & Offline Support States & Handlers ---
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showPwaInfo, setShowPwaInfo] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // 1. Initial State Hydration
  useEffect(() => {
    try {
      const savedTrans = localStorage.getItem(LOCAL_STORAGE_TRANSACTIONS);
      const savedBudget = localStorage.getItem(LOCAL_STORAGE_BUDGET);
      const savedCatBudg = localStorage.getItem(LOCAL_STORAGE_CAT_BUDGETS);
      const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS);

      if (savedTrans) {
        setTransactions(JSON.parse(savedTrans));
      } else {
        // Seeds initial onboarding values
        const seeds = SEED_TRANSACTIONS();
        setTransactions(seeds);
        localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(seeds));
      }

      if (savedBudget) {
        setGeneralBudget(parseFloat(savedBudget));
      }

      if (savedCatBudg) {
        setCategoryBudgets(JSON.parse(savedCatBudg));
      }

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Trigger PIN Lock check on boot if lock is enabled
        if (parsedSettings.pinEnabled && parsedSettings.pinCode) {
          setIsLocked(true);
        }
      }

      const savedSavings = localStorage.getItem(LOCAL_STORAGE_SAVINGS);
      if (savedSavings) {
        setSavingsGoals(JSON.parse(savedSavings));
      } else {
        const seeds: SavingsGoal[] = [
          {
            id: 'savings-seed-1',
            title: 'জরুরি আপৎকালীন তহবিল (Emergency Fund)',
            targetAmount: 50000,
            currentAmount: 15000,
            targetDate: new Date(Date.now() + 180 * 24 * 3600000).toISOString().slice(0, 10), // 6 months later
            notes: 'বিপদের আপৎকালীন বিপত্তিকালীন ৬ মাসের খরচ'
          }
        ];
        setSavingsGoals(seeds);
        localStorage.setItem(LOCAL_STORAGE_SAVINGS, JSON.stringify(seeds));
      }
    } catch (e) {
      console.error("Hydration failed", e);
    }
  }, []);

  // 2. Synchronize theme state with DOM header class
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // 3. Save states safely to local storage on changes
  const saveTransactionsToDisc = (newTrans: Transaction[]) => {
    setTransactions(newTrans);
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(newTrans));
  };

  const handleSaveGeneralBudget = (limit: number) => {
    setGeneralBudget(limit);
    localStorage.setItem(LOCAL_STORAGE_BUDGET, limit.toString());
  };

  const handleSaveCategoryBudget = (category: string, limit: number) => {
    let updated = [...categoryBudgets];
    const existingIdx = updated.findIndex((b) => b.category === category);
    
    if (existingIdx > -1) {
      if (limit <= 0) {
        updated.splice(existingIdx, 1);
      } else {
        updated[existingIdx].limit = limit;
      }
    } else if (limit > 0) {
      updated.push({ category, limit });
    }

    setCategoryBudgets(updated);
    localStorage.setItem(LOCAL_STORAGE_CAT_BUDGETS, JSON.stringify(updated));
  };

  const saveSettingsToDisc = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(newSettings));
  };

  const saveSavingsGoalsToDisc = (newGoals: SavingsGoal[]) => {
    setSavingsGoals(newGoals);
    localStorage.setItem(LOCAL_STORAGE_SAVINGS, JSON.stringify(newGoals));
  };

  const handleCreateOrUpdateSavingsGoal = (goalInput: Omit<SavingsGoal, 'id'> & { id?: string }) => {
    if (goalInput.id) {
      const updated = savingsGoals.map(g => g.id === goalInput.id ? { ...g, ...goalInput } : g);
      saveSavingsGoalsToDisc(updated);
      setOnboardingSuccessFlag(settings.language === 'bn' ? 'সঞ্চয় লক্ষ্য আপডেট করা হয়েছে!' : 'Savings Goal updated!');
    } else {
      const newGoal: SavingsGoal = {
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        ...goalInput
      };
      saveSavingsGoalsToDisc([newGoal, ...savingsGoals]);
      setOnboardingSuccessFlag(settings.language === 'bn' ? 'নতুন সঞ্চয় লক্ষ্য সফলভাবে তৈরি করা হয়েছে!' : 'New Savings Goal created!');
    }
    setTimeout(() => setOnboardingSuccessFlag(''), 3000);
  };

  const handleDeleteSavingsGoal = (id: string) => {
    const updated = savingsGoals.filter(g => g.id !== id);
    saveSavingsGoalsToDisc(updated);
    setOnboardingSuccessFlag(settings.language === 'bn' ? 'সঞ্চয় লক্ষ্যটি মুছে ফেলা হয়েছে!' : 'Savings Goal deleted!');
    setTimeout(() => setOnboardingSuccessFlag(''), 3000);
  };

  const handleUpdateGoalCurrentAmount = (id: string, newAmount: number) => {
    const updated = savingsGoals.map(g => g.id === id ? { ...g, currentAmount: newAmount } : g);
    saveSavingsGoalsToDisc(updated);
    setOnboardingSuccessFlag(settings.language === 'bn' ? 'সঞ্চয়ের অগ্রগতি নিশ্চিত হয়েছে!' : 'Savings progress updated!');
    setTimeout(() => setOnboardingSuccessFlag(''), 3000);
  };

  // --- Database modifications ---
  const handleSaveTransaction = (input: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      // Modify existing
      const updatedTrans = transactions.map((t) => 
        t.id === editingTransaction.id ? { ...t, ...input } : t
      );
      saveTransactionsToDisc(updatedTrans);
      setEditingTransaction(null);
      setOnboardingSuccessFlag(settings.language === 'bn' ? 'হিসাব সফলভাবে পরিবর্তন করা হয়েছে!' : 'Transaction edited!');
    } else {
      // Create new
      const newEntry: Transaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...input
      };
      saveTransactionsToDisc([newEntry, ...transactions]);
      setOnboardingSuccessFlag(translations[settings.language].addSuccess);
    }
    setTimeout(() => setOnboardingSuccessFlag(''), 3000);
  };

  const handleDeleteTransaction = (id: string) => {
    const isConfirmed = window.confirm(
      settings.language === 'bn' ? 'আপনি কি আসলেই এই হিসাবটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this entry?'
    );
    if (!isConfirmed) return;

    const filtered = transactions.filter((t) => t.id !== id);
    saveTransactionsToDisc(filtered);
    setOnboardingSuccessFlag(translations[settings.language].deleteSuccess);
    setTimeout(() => setOnboardingSuccessFlag(''), 3000);
  };

  // --- Language / Theme Switch handlers ---
  const toggleLanguage = () => {
    saveSettingsToDisc({
      ...settings,
      language: settings.language === 'bn' ? 'en' : 'bn'
    });
  };

  const toggleTheme = () => {
    saveSettingsToDisc({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark'
    });
  };

  // --- PIN Configuration Security Flows ---
  const handlePinLockSuccess = () => {
    setIsLocked(false);
  };

  const handleConfigurePin = (newPin?: string) => {
    if (newPin) {
      // Set new PIN
      saveSettingsToDisc({
        ...settings,
        pinEnabled: true,
        pinCode: newPin
      });
      setShowSecurityConfig(false);
      setOnboardingSuccessFlag(translations[settings.language].pinSaved);
    } else {
      // Disable PIN
      saveSettingsToDisc({
        ...settings,
        pinEnabled: false,
        pinCode: ''
      });
      setShowSecurityConfig(false);
      setOnboardingSuccessFlag(translations[settings.language].pinDisabled);
    }
    setTimeout(() => setOnboardingSuccessFlag(''), 3000);
  };

  // --- Import backup integration ---
  const handleImportData = (payload: {
    transactions: Transaction[];
    generalBudget: number;
    categoryBudgets: Budget[];
    appSettings: AppSettings;
  }) => {
    setTransactions(payload.transactions);
    localStorage.setItem(LOCAL_STORAGE_TRANSACTIONS, JSON.stringify(payload.transactions));

    setGeneralBudget(payload.generalBudget);
    localStorage.setItem(LOCAL_STORAGE_BUDGET, payload.generalBudget.toString());

    setCategoryBudgets(payload.categoryBudgets);
    localStorage.setItem(LOCAL_STORAGE_CAT_BUDGETS, JSON.stringify(payload.categoryBudgets));

    saveSettingsToDisc(payload.appSettings);
  };

  // --- Financial summaries calculation variables ---
  const activeLang = settings.language;
  const t = translations[activeLang];

  const currentYearMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentFullDay = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Today's calculations
  const todayTransactions = transactions.filter((tr) => tr.date === currentFullDay);
  const todayIncome = todayTransactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + tr.amount, 0);
  const todayExpense = todayTransactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + tr.amount, 0);

  // Month's calculations
  const monthTransactions = transactions.filter((tr) => tr.date.startsWith(currentYearMonth));
  const monthIncome = monthTransactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + tr.amount, 0);
  const monthExpense = monthTransactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + tr.amount, 0);

  // Remaining cash balance (Offline Total remaining assets)
  const allTimeIncome = transactions.filter(tr => tr.type === 'income').reduce((sum, tr) => sum + tr.amount, 0);
  const allTimeExpense = transactions.filter(tr => tr.type === 'expense').reduce((sum, tr) => sum + tr.amount, 0);
  const netRemainingBalance = allTimeIncome - allTimeExpense;

  // Render Lock Overlay if Locked
  if (isLocked) {
    return (
      <PinLock
        storedPin={settings.pinCode}
        onSuccess={handlePinLockSuccess}
        language={activeLang}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300 pb-12 text-slate-800 dark:text-slate-100">
      
      {/* 1. Header Toolbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-850/70 p-4 transition-colors no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-sky-600 text-white rounded-2xl shadow-md rotate-2 hover:rotate-0 transition-transform">
              <WalletIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-1.5 leading-none">
                {t.appName}
                <span className="bg-sky-500/10 text-sky-650 dark:text-sky-450 text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none">
                  V1.0
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                {t.appSubtitle} (অফলাইন)
              </p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex items-center gap-2">
            
            {/* Generate PDF/Report Modal toggle button */}
            <button
              id="btn-report-screen"
              type="button"
              onClick={() => setShowPrintModal(true)}
              title={t.pdfReport}
              className="p-2.5 bg-slate-100 dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <FileSpreadsheetIcon size={18} />
              <span className="hidden md:inline">{t.pdfReport}</span>
            </button>

            {/* Backups trigger */}
            <button
              id="btn-backup-trigger"
              type="button"
              onClick={() => setShowBackupConfig(!showBackupConfig)}
              title={t.backupRestore}
              className={`p-2.5 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-1 ${
                showBackupConfig 
                  ? 'bg-amber-400/15 text-amber-500 border border-amber-300/30' 
                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <SparklesIcon size={18} />
              <span className="hidden md:inline">{t.backupRestore}</span>
            </button>

            {/* Security Config Pad Lock trigger */}
            <button
              id="btn-security-trigger"
              type="button"
              onClick={() => setShowSecurityConfig(!showSecurityConfig)}
              title={t.security}
              className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                settings.pinEnabled 
                  ? 'bg-emerald-500/15 border border-emerald-400/35 text-emerald-500' 
                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-500 hover:text-slate-700'
              }`}
            >
              {settings.pinEnabled ? <ShieldCheckIcon size={20} /> : <ShieldIcon size={20} />}
            </button>

            {/* PWA Installer Guide Button */}
            <button
              id="btn-pwa-trigger"
              type="button"
              onClick={() => setShowPwaInfo(!showPwaInfo)}
              title={settings.language === 'bn' ? 'মোবাইলে ইনস্টল করুন (Offline App)' : 'Install on Mobile (Offline App)'}
              className={`p-2.5 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center gap-1 ${
                showPwaInfo
                  ? 'bg-sky-500/15 border border-sky-400/35 text-sky-600 dark:text-sky-400'
                  : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              <SmartphoneIcon size={18} />
              <span className="hidden lg:inline">
                {settings.language === 'bn' ? 'মোবাইলে ইনস্টল' : 'Install App'}
              </span>
            </button>

            {/* Language Switch */}
            <button
              id="btn-lang-switcher"
              type="button"
              onClick={toggleLanguage}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-205 dark:hover:bg-slate-800 rounded-xl text-xs font-black transition-colors cursor-pointer"
            >
              {settings.language === 'bn' ? 'EN' : 'বাং'}
            </button>

            {/* Dark Mode Switch */}
            <button
              id="btn-theme-switcher"
              type="button"
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              {settings.theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Alerts toast overlay */}
        {onboardingSuccessFlag && (
          <div className="p-4 rounded-xl bg-sky-500 text-white font-extrabold text-sm shadow-md animate-fade-in flex items-center gap-2">
            <SparklesIcon size={18} />
            {onboardingSuccessFlag}
          </div>
        )}

        {/* Dynamic Offline Capability Banner */}
        {!isOnline && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/30 text-amber-850 dark:text-amber-400 font-bold text-xs shadow-sm flex items-start gap-3 no-print animate-pulse">
            <CloudOffIcon size={20} className="flex-shrink-0 mt-0.5 text-amber-500" />
            <div>
              <p className="font-extrabold text-sm text-amber-850 dark:text-amber-300">
                {settings.language === 'bn' ? 'আপনি এখন সম্পূর্ণ অফলাইনে আছেন!' : 'You are currently fully offline!'}
              </p>
              <p className="mt-0.5 leading-relaxed font-semibold opacity-90 text-[11px]">
                {settings.language === 'bn' 
                  ? 'কোনো চিন্তা নেই! আজকের হিসাব অ্যাপটি সম্পূর্ণ ইন্টারনেট ছাড়া কাজ করে। আপনার সব হিসাব নিরাপদে আপনার নিজের মোবাইলের মেমরিতে কাজ করছে এবং ইন্টারনেট কানেক্ট না থাকলেও ডাটা সুরক্ষিত থাকবে।'
                  : 'No worries! Daily Hisab works 100% offline. All inputs are safely saved locally on your device storage and will remain intact.'}
              </p>
            </div>
          </div>
        )}

        {/* Segmented Tab Switcher Navigation */}
        <div className="flex bg-slate-150 dark:bg-slate-900/60 p-1.5 rounded-2xl max-w-md mx-auto md:mx-0 border border-slate-200/40 dark:border-slate-800/80 no-print shadow-sm">
          <button
            id="tab-dashboard-trigger"
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer outline-none ${
              activeTab === 'dashboard'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-md scale-[1.01]'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            📊 {settings.language === 'bn' ? 'ড্যাশবোর্ড ও হিসাব' : 'Dashboard & Ledger'}
          </button>
          
          <button
            id="tab-savings-trigger"
            type="button"
            onClick={() => {
              setActiveTab('savings');
              setEditingTransaction(null);
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-black transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer outline-none ${
              activeTab === 'savings'
                ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-md scale-[1.01]'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-330'
            }`}
          >
            🐷 {settings.language === 'bn' ? 'সঞ্চয় উইন্ডো' : 'Savings Window'}
          </button>
        </div>

        {/* PWA Settings / Offline Usage Guide Panel */}
        {showPwaInfo && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-sky-100 dark:border-slate-800 shadow-xl space-y-6 no-print animate-fade-in">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 w-full">
                <div className="p-3 bg-sky-550/10 text-sky-600 dark:text-sky-400 rounded-2xl">
                  <SmartphoneIcon size={24} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {settings.language === 'bn' ? 'মোবাইলে ইনস্টল ও অফলাইন নির্দেশিকা' : 'Mobile Installation & Offline Guide'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {settings.language === 'bn' ? 'ইন্টারনেট ছাড়াই অ্যাপটি ব্যবহার করার পদ্ধতি' : 'How to use this app 100% offline like a native app'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPwaInfo(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
              >
                <XIcon size={18} />
              </button>
            </div>

            {/* Offline Capability Highlight */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl flex items-start gap-3">
              <span className="text-emerald-500 text-xl font-black mt-0.5">✓</span>
              <div>
                <p className="text-sm font-black text-emerald-850 dark:text-emerald-450">
                  {settings.language === 'bn' ? '১০০% অফলাইন ডাটা স্টোরেজ' : '100% Offline Data Storage'}
                </p>
                <p className="text-xs text-emerald-700/90 dark:text-emerald-400/80 mt-0.5 leading-relaxed font-semibold">
                  {settings.language === 'bn' 
                    ? 'আপনার ইনপুট করা কোনো ডাটা বাইরের সার্ভারে যায় না। সম্পূর্ণ হিসাব আপনার নিজের মোবাইলে সুরক্ষিত থাকে। ইন্টারনেট চলে গেলেও অ্যাপটি সম্পূর্ণ সচল থাকবে এবং ডাটা হারাবে না।' 
                    : 'Your financial data is saved locally on your phone using browser sandbox storage. Zero data leaves your device. It works perfectly even in deep flight mode or areas with no internet.'}
                </p>
              </div>
            </div>

            {/* Programmatic click-to-install if supported */}
            {deferredPrompt && (
              <div className="p-4 bg-sky-500/10 border border-sky-550/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                <div>
                  <p className="text-sm font-black text-sky-850 dark:text-sky-300">
                    {settings.language === 'bn' ? 'সহজ এক-ক্লিক ইনস্টল!' : 'Easy One-Click Install Available!'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                    {settings.language === 'bn' 
                      ? 'ভিজিটর বা ব্রাউজার ট্যাব ছাড়াই সরাসরি অ্যাপ আকারে স্ক্রিনে যুক্ত করতে নিচের বাটনে চাপ দিন।' 
                      : 'Install this app directly onto your device home screen for quick, offline launch.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  {settings.language === 'bn' ? 'এখনই ইনস্টল করুন' : 'Install Offline App'}
                </button>
              </div>
            )}

            {/* Manual instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-left">
              {/* Android User */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-905/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-sky-550/15 text-sky-600 dark:text-sky-400 text-xs rounded-md">Android</span>
                  {settings.language === 'bn' ? 'অ্যান্ড্রয়েড / ক্রোম নির্দেশিকা' : 'Android / Chrome Details'}
                </h4>
                <ol className="text-xs space-y-2 list-decimal pl-4 text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
                  <li>{settings.language === 'bn' ? 'আপনার মোবাইলে Google Chrome ব্রাউজার দিয়ে এই লিংকে প্রবেশ করুন।' : 'Open this app link inside Google Chrome on Android.'}</li>
                  <li>{settings.language === 'bn' ? 'উপরের ডানদিকের থ্রি-ডট (৩টি ডট) মেনু চাপুন।' : 'Tap the three-dot menu icon in the upper-right corner.'}</li>
                  <li>{settings.language === 'bn' ? 'তালিকায় "Install App" বা "Add to Home screen" অপশনে ক্লিক করুন।' : 'Select "Install app" or "Add to Home screen" from the menu options.'}</li>
                  <li>{settings.language === 'bn' ? 'নিশ্চিত করুন। অ্যাপটি আপনার ফোনে একটি নেটিভ অ্যাপের মতো যুক্ত হয়ে যাবে।' : 'Confirm installation. The app will appear on your home screen instantly.'}</li>
                </ol>
              </div>

              {/* iOS User */}
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-905/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-550/15 text-indigo-600 dark:text-indigo-400 text-xs rounded-md">iOS / Safari</span>
                  {settings.language === 'bn' ? 'আইফোন / সাফারি নির্দেশিকা' : 'iPhone / iPad / Safari Details'}
                </h4>
                <ol className="text-xs space-y-2 list-decimal pl-4 text-slate-650 dark:text-slate-400 leading-relaxed font-semibold">
                  <li>{settings.language === 'bn' ? 'সাফারি (Safari) ব্রাউজার দিয়ে এই অ্যাপ লিংকে প্রবেশ করুন।' : 'Open this app link inside the official Safari browser.'}</li>
                  <li>{settings.language === 'bn' ? 'নিচের টুলবারের "Share" (শেয়ার আইকন - বক্স থেকে বের হওয়া তিরচিহ্ন) চাপুন।' : 'Tap the "Share" button at the bottom toolbar.'}</li>
                  <li>{settings.language === 'bn' ? 'তালিকায় একটু নিচে গিয়ে "Add to Home Screen" অপশনটি নির্বাচন করুন।' : 'Scroll down and select the "Add to Home Screen" option.'}</li>
                  <li>{settings.language === 'bn' ? 'উপরের কোণায় "Add" চাপুন। এখন এটি হোম স্ক্রিনের অ্যাপ লোগো হয়ে কাজ করবে!' : 'Tap "Add" in the top-right corner. It is now a native shortcut on your screen!'}</li>
                </ol>
              </div>
            </div>

            {/* Offline usage disclaimer/notes */}
            <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] rounded-xl flex items-center gap-2 font-semibold">
              <span className="text-sm font-bold">⚠</span>
              <span>
                {settings.language === 'bn'
                  ? 'গুরুত্বপূর্ণ সতর্কতা: আপনার ব্রাউজারের অল ক্লিয়ার ডাটা (Clear All Site Cookies/Data) করলে আপনার স্থানীয় হিসাব মুছে যেতে পারে। তাই ডাটা সুরক্ষিত রাখতে ব্যাকআপ অপশনটি থেকে নিয়মিত আপনার "ব্যাকআপ ফাইল ডাউনলোড" করে রাখুন।'
                  : 'Important Note: Clearing browser cache, private data or cookies completely may wipe out your local active database storage. Remember to download backup database JSON files regularly!'}
              </span>
            </div>
          </div>
        )}

        {/* 2. Security PIN Setup Module Overlay Card (Inline block) */}
        {showSecurityConfig && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-emerald-250 dark:border-emerald-800/25 shadow-lg space-y-4 max-w-sm ml-auto no-print">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-emerald-650 dark:text-emerald-400 flex items-center gap-1.5">
                <ShieldCheckIcon size={18} />
                {t.security}
              </h3>
              <button
                id="btn-close-security"
                type="button"
                onClick={() => setShowSecurityConfig(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer focus:outline-none"
              >
                {t.cancel}
              </button>
            </div>

            {settings.pinEnabled ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-505">
                  {settings.language === 'bn'
                    ? 'আপনার অ্যাপটি ৪ ডিজিটের পিন দ্বারা সুনিশ্চিত রয়েছে।'
                    : 'Your transactions are fully secured with PIN passcode protection.'}
                </p>
                <button
                  id="btn-disable-pin"
                  type="button"
                  onClick={() => handleConfigurePin(undefined)}
                  className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  {t.disablePin}
                </button>
              </div>
            ) : (
              <PinLock
                storedPin=""
                isSetupMode={true}
                onSuccess={handleConfigurePin}
                onCancel={() => setShowSecurityConfig(false)}
                language={activeLang}
              />
            )}
          </div>
        )}

        {/* 3. Backup and database restore Section Drawer (Inline block) */}
        {showBackupConfig && (
          <div className="no-print animate-fade-in">
            <BackupRestore
              transactions={transactions}
              generalBudget={generalBudget}
              categoryBudgets={categoryBudgets}
              appSettings={settings}
              onImportDone={handleImportData}
              language={activeLang}
            />
          </div>
        )}

        {activeTab === 'savings' ? (
          <SavingsWindow
            goals={savingsGoals}
            onSaveGoal={handleCreateOrUpdateSavingsGoal}
            onDeleteGoal={handleDeleteSavingsGoal}
            onUpdateGoalAmount={handleUpdateGoalCurrentAmount}
            language={activeLang}
          />
        ) : (
          <>
            {/* --- 4. Budget Threshold Warning Alert banner --- */}
            {generalBudget > 0 && monthExpense > generalBudget && (
              <div className="p-4 bg-red-105 dark:bg-red-950/20 border border-red-300 dark:border-red-800/40 text-red-850 dark:text-red-400 rounded-2xl flex items-center gap-3">
                <AlertTriangleIcon className="flex-shrink-0 text-red-500" size={24} />
                <div>
                  <p className="text-sm font-black">{t.budgetExceeded}</p>
                  <p className="text-xs opacity-90 font-medium">
                    {settings.language === 'bn'
                      ? `আপনি চলতি মাসের খরচের লিমিট (${formatCurrency(generalBudget, true)}) অতিক্রম করে গেছেন!`
                      : `You have crossed your set overall budget of ${formatCurrency(generalBudget, false)}!`}
                  </p>
                </div>
              </div>
            )}

            {/* 5. Summaries Horizontal Cards Grid (Daily / Monthly / Yearly calculations) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
              
              {/* Today's Totals */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:scale-[1.01] flex flex-col justify-between h-32">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarIcon size={13} className="text-sky-505" />
                    {t.dailySummary}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatCurrency(todayIncome - todayExpense, activeLang === 'bn')}
                  </p>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2.5">
                  <span className="text-emerald-500 font-bold">+{formatCurrency(todayIncome, activeLang === 'bn')}</span>
                  <span className="text-rose-500 font-bold">-{formatCurrency(todayExpense, activeLang === 'bn')}</span>
                </div>
              </div>

              {/* Monthly balances */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:scale-[1.01] flex flex-col justify-between h-32">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUpIcon size={13} className="text-emerald-505" />
                    {t.monthlySummary}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {formatCurrency(monthIncome - monthExpense, activeLang === 'bn')}
                  </p>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-855 pt-2.5">
                  <span className="text-emerald-500 font-bold">+{formatCurrency(monthIncome, activeLang === 'bn')}</span>
                  <span className="text-rose-500 font-bold">-{formatCurrency(monthExpense, activeLang === 'bn')}</span>
                </div>
              </div>

              {/* All time Assets Balance Sheet */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:scale-[1.01] flex flex-col justify-between h-32">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <WalletIcon size={13} className="text-sky-505" />
                    {settings.language === 'bn' ? 'মোট অবশিষ্ট নগদ' : 'Net Remaining Wealth'}
                  </p>
                  <p className={`text-base font-black mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis ${
                    netRemainingBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-500'
                  }`}>
                    {formatCurrency(netRemainingBalance, activeLang === 'bn')}
                  </p>
                </div>
                
                <div className="flex justify-between text-[10px] text-slate-555 dark:text-slate-400 border-t border-slate-100 dark:border-slate-855 pt-2.5">
                  <span>{settings.language === 'bn' ? 'মোট আয়:' : 'All Income:'} {formatCurrency(allTimeIncome, activeLang === 'bn')}</span>
                </div>
              </div>

              {/* Budget Meter info */}
              <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm transition-transform hover:scale-[1.01] flex flex-col justify-between h-32">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingDownIcon size={13} className="text-amber-505" />
                    {t.budgetStatus} ({settings.language === 'bn' ? 'মাসিক' : 'Monthly'})
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis">
                    {generalBudget > 0 
                      ? `${Math.round((monthExpense / generalBudget) * 100)}%` 
                      : (settings.language === 'bn' ? 'বিনাবাজেট' : 'Unlimited')}
                  </p>
                </div>
                
                <div className="border-t border-slate-100 dark:border-slate-855 pt-2.5 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>{settings.language === 'bn' ? 'বাজেট:' : 'Limit:'} {formatCurrency(generalBudget, activeLang === 'bn')}</span>
                  {monthExpense > generalBudget && (
                    <span className="text-red-500 font-black">OVER!</span>
                  )}
                </div>
              </div>

            </div>

            {/* 6. Main Dashboard Column Substructures */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-print">
              
              {/* Left Column content: Forms & Visual Charts */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Quick entry transaction form */}
                <TransactionForm
                  onSave={handleSaveTransaction}
                  editingTransaction={editingTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                  language={activeLang}
                />

                {/* Visual sectoral Pie segments */}
                <CategoryPieChart
                  transactions={transactions}
                  selectedMonth={currentYearMonth}
                  language={activeLang}
                />

              </div>

              {/* Right Column content: Chronological ledger ledger lists, budgets */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Ledger List */}
                <TransactionList
                   transactions={transactions}
                   onEdit={(tr) => {
                     setEditingTransaction(tr);
                     // Auto scroll to editing form if on mobile
                     window.scrollTo({ top: 120, behavior: 'smooth' });
                   }}
                   onDelete={handleDeleteTransaction}
                   language={activeLang}
                />

                {/* Budget limit panels */}
                <BudgetSettings
                  generalBudget={generalBudget}
                  categoryBudgets={categoryBudgets}
                  onSaveGeneralBudget={handleSaveGeneralBudget}
                  onSaveCategoryBudget={handleSaveCategoryBudget}
                  transactions={transactions}
                  language={activeLang}
                />

              </div>

            </div>
          </>
        )}

      </main>

      {/* 7. PDF Report Printer overlay screen sheet */}
      {showPrintModal && (
        <MonthlyReportPrint
          transactions={transactions}
          onClose={() => setShowPrintModal(false)}
          language={activeLang}
        />
      )}

    </div>
  );
}
