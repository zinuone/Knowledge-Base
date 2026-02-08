
import React from 'react';

interface KnowledgeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ title, description, icon, colorClass }) => {
  return (
    <div className="group bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-kemenkeu-gold/30 hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-kemenkeu-gold/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-kemenkeu-gold/10 transition-colors"></div>
      
      <div className={`w-16 h-16 rounded-xl ${colorClass} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
        {icon}
      </div>
      
      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-kemenkeu-green transition-colors flex items-center">
        {title}
      </h3>
      
      <p className="text-slate-500 leading-relaxed text-sm">
        {description}
      </p>
      
      <div className="mt-6 flex items-center text-kemenkeu-green text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 group-hover:text-kemenkeu-gold transition-all">
        Detail Informasi <i className="fas fa-arrow-right ml-2 group-hover:ml-4 transition-all"></i>
      </div>
    </div>
  );
};

export default KnowledgeCard;
