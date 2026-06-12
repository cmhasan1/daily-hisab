import { useState, useEffect } from 'react';
import { Lock, Unlock, X, ShieldAlert, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toBanglaDigits } from '../utils/translations';

interface PinLockProps {
  storedPin: string;
  isSetupMode?: boolean; // Set to true if configuring / changing PIN, false for lock screen
  onSuccess: (newPin?: string) => void;
  onCancel?: () => void;
  language: 'bn' | 'en';
}

export default function PinLock({
  storedPin,
  isSetupMode = false,
  onSuccess,
  onCancel,
  language
}: PinLockProps) {
  const [pin, setPin] = useState<string>('');
  const [confirmMode, setConfirmMode] = useState<boolean>(false);
  const [tempPin, setTempPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const t = {
    bn: {
      enterCurrent: "বর্তমান পিন কোডটি লিখুন",
      enterNew: "নতুন ৪-ডিজিটের পিন লিখুন",
      confirmNew: "পিনটি নিশ্চিত করতে আবার লিখুন",
      enterPin: "অ্যাপ সেশন আনলক করতে পিন দিন",
      wrongPin: "ভুল পিন কোড! আবার চেষ্টা করুন",
      notMatching: "পিন দুটি মেলেনি! আবার চেষ্টা করুন",
      successUnlock: "সফলভাবে আনলক করা হয়েছে!",
      successSetup: "পিন কোড সফলভাবে সেট করা হয়েছে!",
      cancel: "বাতিল",
      clear: "মুছুন"
    },
    en: {
      enterCurrent: "Enter current PIN",
      enterNew: "Enter new 4-digit PIN",
      confirmNew: "Confirm your 4-digit PIN",
      enterPin: "Enter PIN to access your Hisab",
      wrongPin: "Incorrect PIN! Please try again",
      notMatching: "PINs do not match! Start over",
      successUnlock: "Unlocked successfully!",
      successSetup: "PIN configured successfully!",
      cancel: "Cancel",
      clear: "Clear"
    }
  }[language];

  // Reset PIN input if mode shifts
  useEffect(() => {
    setPin('');
    setConfirmMode(false);
    setTempPin('');
    setErrorMessage('');
    setIsSuccess(false);
  }, [isSetupMode]);

  const handleNumberClick = (digit: string) => {
    if (isSuccess || pin.length >= 4) return;
    setErrorMessage('');
    const nextPin = pin + digit;
    setPin(nextPin);

    // Auto trigger check when 4 digits are input
    if (nextPin.length === 4) {
      setTimeout(() => {
        handleCompletePin(nextPin);
      }, 200);
    }
  };

  const handleBackspace = () => {
    if (isSuccess) return;
    setPin(prev => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleCompletePin = (completedPin: string) => {
    if (isSetupMode) {
      if (!confirmMode) {
        // First entry done, save and proceed to confirm screen
        setTempPin(completedPin);
        setPin('');
        setConfirmMode(true);
      } else {
        // Confirm screen, test if it matches first screen
        if (completedPin === tempPin) {
          setIsSuccess(true);
          setTimeout(() => {
            onSuccess(completedPin);
          }, 800);
        } else {
          setErrorMessage(t.notMatching);
          setPin('');
          setConfirmMode(false);
          setTempPin('');
        }
      }
    } else {
      // Unlocking setup
      if (completedPin === storedPin) {
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setErrorMessage(t.wrongPin);
        // Clean feedback vibrate
        if (navigator.vibrate) navigator.vibrate(150);
        setPin('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-6 select-none transition-colors duration-300">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Animated Icon Lock Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="mb-8"
        >
          <div className="p-4 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-full shadow-md">
            {isSuccess ? (
              <Unlock size={36} className="text-emerald-500 animate-pulse" />
            ) : (
              <Lock size={36} />
            )}
          </div>
        </motion.div>

        {/* Dynamic State Info */}
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 text-center mb-2">
          {isSetupMode ? (
            confirmMode ? t.confirmNew : t.enterNew
          ) : (
            t.enterPin
          )}
        </h2>

        {/* PIN Indicators Dots */}
        <div className="flex space-x-4 my-6">
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: pin.length > index ? 1.25 : 1,
                backgroundColor: isSuccess 
                  ? '#10B981' 
                  : errorMessage 
                    ? '#EF4444' 
                    : pin.length > index 
                      ? '#0D9488' 
                      : '#D1D5DB'
              }}
              className={`w-4 h-4 rounded-full border border-transparent dark:border-gray-700 transition-colors duration-200`}
            />
          ))}
        </div>

        {/* Error Notification Alert */}
        <div className="h-6 mb-4">
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-sm font-semibold text-red-500 dark:text-red-400 flex items-center justify-center gap-1.5"
              >
                <ShieldAlert size={16} />
                {errorMessage}
              </motion.p>
            )}
            {isSuccess && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-semibold text-emerald-500 flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                {isSetupMode ? t.successSetup : t.successUnlock}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Numerical Grid Keyboard pad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              id={`pin-btn-${num}`}
              onClick={() => handleNumberClick(num)}
              className="w-16 h-16 rounded-full flex flex-col items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 text-2xl font-bold border border-gray-100 dark:border-gray-700/50 shadow-sm cursor-pointer transition-colors active:scale-95"
            >
              {toBanglaDigits(num, language === 'bn')}
            </button>
          ))}

          {/* Cancel option */}
          {onCancel ? (
            <button
              id="pin-btn-cancel"
              onClick={onCancel}
              className="w-16 h-16 rounded-full flex items-center justify-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer active:scale-95 transition-transform"
            >
              {t.cancel}
            </button>
          ) : (
            <div className="w-16 h-16" />
          )}

          {/* 0 Button */}
          <button
            id="pin-btn-0"
            onClick={() => handleNumberClick('0')}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 text-2xl font-bold border border-gray-100 dark:border-gray-700/50 shadow-sm cursor-pointer active:scale-95"
          >
            {toBanglaDigits('0', language === 'bn')}
          </button>

          {/* Backspace Button */}
          <button
            id="pin-btn-backspace"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer active:scale-95 transition-transform"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
