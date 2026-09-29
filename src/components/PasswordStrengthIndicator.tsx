import React from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({ password }) => {
  const hasMinLength = password.length >= 8;
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const checks = [
    { label: 'At least 8 characters', met: hasMinLength },
    { label: 'Uppercase & lowercase letters', met: hasMixedCase },
    { label: 'At least one number (0-9)', met: hasNumber },
    { label: 'Special character (!@#$%^&*)', met: hasSpecial },
  ];

  const score = checks.filter((c) => c.met).length;

  const getStrengthMeta = () => {
    if (!password) return { text: 'Enter password', color: 'bg-slate-200 dark:bg-slate-700', textClass: 'text-slate-400' };
    if (score <= 1) return { text: 'Weak', color: 'bg-rose-500', textClass: 'text-rose-500' };
    if (score === 2) return { text: 'Fair', color: 'bg-amber-500', textClass: 'text-amber-500' };
    if (score === 3) return { text: 'Good', color: 'bg-blue-500', textClass: 'text-blue-500' };
    return { text: 'Strong', color: 'bg-emerald-500', textClass: 'text-emerald-500' };
  };

  const meta = getStrengthMeta();

  return (
    <div className="mt-2 space-y-2">
      {/* 4-bar indicator */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4].map((barIndex) => (
          <div
            key={barIndex}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              score >= barIndex ? meta.color : 'bg-slate-200 dark:bg-slate-700'
            }`}
          />
        ))}
        <span className={`text-[11px] font-semibold min-w-[50px] text-right ${meta.textClass}`}>
          {meta.text}
        </span>
      </div>

      {/* Rules checklist */}
      {password.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {checks.map((check, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {check.met ? (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
              ) : (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <X className="h-2.5 w-2.5" />
                </span>
              )}
              <span className={check.met ? 'text-slate-700 dark:text-slate-200 font-medium' : ''}>
                {check.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
