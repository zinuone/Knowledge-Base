// File: src/components/FAQItem.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isLast?: boolean;
  index?: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isLast, index = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`
        rounded-2xl border overflow-hidden transition-all duration-300
        ${isOpen
          ? 'border-[#0D5C35]/25 shadow-lg shadow-emerald-900/8 bg-gradient-to-br from-white to-[#EAF2EE]/40'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        }
        ${!isLast ? 'mb-3' : ''}
      `}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-5 px-5 md:px-6 flex items-start justify-between text-left gap-3 group"
        aria-expanded={isOpen}
      >
        {/* Nomor bulat + teks pertanyaan */}
        <div className="flex items-start gap-3 min-w-0">
          <span
            className={`
              flex-shrink-0 w-6 h-6 rounded-full text-xs font-black
              flex items-center justify-center mt-0.5 transition-all duration-300
              ${isOpen
                ? 'bg-[#0D5C35] text-white shadow-md shadow-emerald-900/20'
                : 'bg-amber-100 text-amber-700 border border-amber-200 group-hover:bg-amber-200'
              }
            `}
          >
            {index + 1}
          </span>
          <span
            className={`
              font-bold leading-snug transition-colors duration-200
              ${isOpen
                ? 'text-[#0D5C35]'
                : 'text-slate-800 group-hover:text-[#0D5C35]'
              }
            `}
          >
            {question}
          </span>
        </div>

        {/* Chevron dalam lingkaran */}
        <span
          className={`
            flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center
            transition-all duration-300 mt-0.5
            ${isOpen
              ? 'bg-[#0D5C35] text-white rotate-180 shadow-md shadow-emerald-900/20'
              : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
            }
          `}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      {/* Jawaban dengan gold accent line */}
      <div
        className={`
          overflow-hidden transition-all duration-350 ease-in-out
          ${isOpen ? 'max-h-[700px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-5 md:px-6 pb-6 pl-[3.5rem]">
          <div className="border-l-4 border-[#D4AF37]/60 pl-4 text-slate-600 leading-relaxed text-sm">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQItem;