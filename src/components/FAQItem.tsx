
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isLast?: boolean;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isLast }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`transition-colors duration-300 ${isOpen ? 'bg-kemenkeu-greenLight/20' : ''} ${!isLast ? 'border-b border-slate-100' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 px-8 flex justify-between items-center text-left hover:bg-slate-50 transition-all group"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-kemenkeu-green' : 'text-slate-700 group-hover:text-kemenkeu-green'}`}>
          {question}
        </span>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-kemenkeu-green text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-8 pb-8 text-slate-600 leading-relaxed border-l-4 border-kemenkeu-gold ml-8 mb-4">
          {answer}
        </div>
      </div>
    </div>
  );
};

export default FAQItem;
