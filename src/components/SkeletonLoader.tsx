// File: src/components/SkeletonLoader.tsx
import React from 'react';

// 1. Skeleton untuk Kartu (Kategori & Related Content)
export const SkeletonCard = () => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full animate-pulse">
            {/* Icon Circle */}
            <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4"></div>

            {/* Title Bar */}
            <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>

            {/* Description Lines */}
            <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
        </div>
    );
};

// 2. Skeleton untuk Baris Tabel
export const SkeletonRow = () => {
    return (
        <tr className="animate-pulse border-b border-slate-50">
            <td className="px-6 py-4">
                <div className="h-4 bg-slate-200 rounded w-8 mx-auto"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                <div className="h-5 bg-slate-200 rounded w-64 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-32"></div>
            </td>
            <td className="px-6 py-4 text-center">
                <div className="h-8 bg-slate-200 rounded-lg w-20 mx-auto"></div>
            </td>
        </tr>
    );
};