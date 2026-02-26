// File: src/components/KnowledgeCard.tsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface KnowledgeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ title, description, icon, colorClass }) => {
  return (
    <div
      className="
        group bg-white dark:bg-[#162918] p-7 rounded-2xl
        border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-2xl hover:border-[#D4AF37]/30 dark:hover:border-[#D4AF37]/25 hover:-translate-y-2
        transition-all duration-400 cursor-pointer overflow-hidden relative
        h-full flex flex-col justify-between
      "
    >
      {/* Shimmer glare saat hover */}
      <div className="
        absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none
        bg-gradient-to-br from-transparent via-[#D4AF37]/5 to-transparent
        transition-opacity duration-500
      " />

      {/* Dekorasi sudut kanan atas — sebelumnya pakai kemenkeu-gold (broken) */}
      <div className="
        absolute top-0 right-0 w-28 h-28 rounded-bl-full -mr-14 -mt-14
        bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/12
        transition-colors duration-500
      " />

      {/* ── Konten atas ── */}
      <div className="flex-grow relative z-10">
        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-xl ${colorClass} flex items-center justify-center mb-5
          group-hover:scale-110 transition-transform duration-400 shadow-sm group-hover:shadow-md
        `}>
          {icon}
        </div>

        {/* Title */}
        <h3 className="
          text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2.5 leading-tight
          group-hover:text-[#0D5C35] dark:group-hover:text-emerald-400 transition-colors duration-200
        ">
          {title}
        </h3>

        {/* Deskripsi */}
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
          {description}
        </p>
      </div>

      {/* ── Footer ── */}
      <div className="
        mt-6 pt-4 border-t border-slate-100 dark:border-slate-700
        flex items-center justify-between
        opacity-60 group-hover:opacity-100
        text-[#0D5C35] dark:text-emerald-400 group-hover:text-[#D4AF37] dark:group-hover:text-[#D4AF37]
        transition-all duration-300
      ">
        <span className="text-[10px] font-black uppercase tracking-[0.18em]">
          Detail Informasi
        </span>
        {/* Lucide ArrowRight menggantikan Font Awesome yang tidak di-import */}
        <ArrowRight className="
          w-4 h-4
          group-hover:translate-x-1.5
          transition-transform duration-300
        " />
      </div>
    </div>
  );
};

export default KnowledgeCard;