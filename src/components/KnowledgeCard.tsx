// File: src/components/KnowledgeCard.tsx
import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';

interface KnowledgeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  colorClass: string;
  docCount?: number;
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ title, description, icon, colorClass, docCount }) => {
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
        bg-gradient-to-br from-transparent via-[#D4AF37]/4 to-transparent
        transition-opacity duration-500
      " />

      {/* ── Dekorasi siluet lingkaran berlapis ── */}
      {/* Ring 1 — besar, background */}
      <div className="
        absolute -top-12 -right-12 w-40 h-40 rounded-full
        bg-[#D4AF37]/5 group-hover:bg-[#D4AF37]/10
        transition-all duration-700 group-hover:scale-110
        pointer-events-none
      " />
      {/* Ring 2 — sedang */}
      {/* <div className="
        absolute -top-4 -right-4 w-24 h-24 rounded-full
        border border-[#D4AF37]/8 group-hover:border-[#D4AF37]/20
        transition-all duration-500 group-hover:scale-105
        pointer-events-none
      " /> */}
      {/* Ring 3 — kecil, lebih visible */}
      {/* <div className="
        absolute top-0 right-0 w-12 h-12 rounded-bl-full
        bg-gradient-to-bl from-[#D4AF37]/10 to-transparent
        group-hover:from-[#D4AF37]/20
        transition-all duration-400
        pointer-events-none
      " /> */}
      {/* Ring 4 — bottom-left accent */}
      {/* <div className="
        absolute -bottom-8 -left-8 w-24 h-24 rounded-full
        bg-slate-50 dark:bg-slate-800/40 group-hover:bg-[#EAF2EE] dark:group-hover:bg-[#0D5C35]/10
        transition-all duration-500
        pointer-events-none
      " /> */}

      {/* ── Konten atas ── */}
      <div className="flex-grow relative z-10">
        {/* Icon + doc count */}
        <div className="flex items-start justify-between mb-5">
          <div className={`
            w-14 h-14 rounded-xl ${colorClass} flex items-center justify-center
            group-hover:scale-110 transition-transform duration-400 shadow-sm group-hover:shadow-md
          `}>
            {icon}
          </div>
          {docCount !== undefined && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-2xl font-black text-slate-200 dark:text-slate-700 group-hover:text-[#D4AF37]/40 transition-colors leading-none">
                {docCount}
              </span>
              <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-wider">
                {docCount === 1 ? 'dokumen' : 'dokumen'}
              </span>
            </div>
          )}
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
        <span className="text-[10px] font-black uppercase tracking-[0.18em] flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          Lihat Dokumen
        </span>
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