// File: src/components/SkeletonLoader.tsx
import React from 'react';

/* ─────────────────────────────────────────────────────────────────
   Shimmer wave CSS — dipanggil sekali oleh komponen manapun
   yang pertama kali dirender.

   Dark mode menggunakan selector `.dark .shimmer` yang sesuai
   dengan konfigurasi darkMode: "class" di tailwind.config
   (index.html). Warna dipilih dari palette proyek yang sudah ada:
     light → #f1f5f2 / #e2ede7
     dark  → #162918 / #1e3c27  (sama dengan dark:bg-[#162918])
───────────────────────────────────────────────────────────────── */
const SHIMMER_CSS = `
@keyframes shimmerWave {
  0%   { background-position: -800px 0; }
  100% { background-position:  800px 0; }
}

/* ── Light mode ── */
.shimmer {
  background: linear-gradient(
    90deg,
    #f1f5f2 25%,
    #e2ede7 50%,
    #f1f5f2 75%
  );
  background-size: 800px 100%;
  animation: shimmerWave 1.8s ease-in-out infinite;
}

/* ── Dark mode ── */
.dark .shimmer {
  background: linear-gradient(
    90deg,
    #162918 25%,
    #1e3c27 50%,
    #162918 75%
  );
  background-size: 800px 100%;
  animation: shimmerWave 1.8s ease-in-out infinite;
}
`;

const ShimmerStyle = () => (
    <style dangerouslySetInnerHTML={{ __html: SHIMMER_CSS }} />
);

/* ═══════════════════════════════════════════════════════════════
   1. Skeleton Kartu Kategori / Related
═══════════════════════════════════════════════════════════════ */
export const SkeletonCard = () => (
    <>
        <ShimmerStyle />
        <div className="bg-white dark:bg-[#162918] p-7 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm h-full flex flex-col gap-4">
            <div className="shimmer w-14 h-14 rounded-xl" />
            <div className="shimmer h-5 rounded-lg w-3/4" />
            <div className="space-y-2 flex-grow">
                <div className="shimmer h-3.5 rounded-lg w-full" />
                <div className="shimmer h-3.5 rounded-lg w-5/6" />
                <div className="shimmer h-3.5 rounded-lg w-4/6" />
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                <div className="shimmer h-3 rounded-lg w-2/5" />
            </div>
        </div>
    </>
);

/* ═══════════════════════════════════════════════════════════════
   2. Skeleton Baris Tabel
═══════════════════════════════════════════════════════════════ */
export const SkeletonRow = () => (
    <>
        <ShimmerStyle />
        <tr className="border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-[#162918]">
            <td className="px-4 py-4 hidden sm:table-cell text-center">
                <div className="shimmer h-4 rounded w-5 mx-auto" />
            </td>
            <td className="px-4 py-4">
                <div className="shimmer h-4 rounded-lg w-20 mb-2" />
                <div className="shimmer h-5 rounded-lg w-3/4 mb-2" />
                <div className="shimmer h-3 rounded-lg w-32" />
            </td>
            <td className="px-4 py-4 text-center">
                <div className="shimmer h-8 rounded-lg w-20 mx-auto" />
            </td>
        </tr>
    </>
);

/* ═══════════════════════════════════════════════════════════════
   3. Skeleton Detail Page — meniru struktur persis halaman Detail
═══════════════════════════════════════════════════════════════ */
export const SkeletonDetail = () => (
    <>
        <ShimmerStyle />
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
                <div className="shimmer h-3.5 rounded-full w-14" />
                <div className="shimmer h-3 rounded-full w-3" />
                <div className="shimmer h-3.5 rounded-full w-20" />
                <div className="shimmer h-3 rounded-full w-3" />
                <div className="shimmer h-3.5 rounded-full w-36" />
            </div>

            {/* Artikel card */}
            <div className="bg-white dark:bg-[#162918] rounded-3xl shadow-md border border-slate-100 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-8 md:p-12 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-br from-white via-slate-50 to-emerald-50/20 dark:from-[#162918] dark:via-[#1a3021] dark:to-[#162918]">
                    <div className="flex flex-wrap gap-3 mb-6">
                        <div className="shimmer h-7 rounded-full w-28" />
                        <div className="shimmer h-7 rounded-full w-36" />
                        <div className="shimmer h-7 rounded-full w-24" />
                    </div>
                    <div className="shimmer h-11 rounded-xl w-5/6 mb-3" />
                    <div className="shimmer h-11 rounded-xl w-3/5 mb-7" />
                    <div className="shimmer h-5 rounded-lg w-full mb-2" />
                    <div className="shimmer h-5 rounded-lg w-4/5" />
                </div>

                {/* Konten */}
                <div className="p-8 md:p-10 space-y-3">
                    {[100, 92, 97, 82, 75, 88, 78, 64, 95, 72, 85, 60].map((w, i) => (
                        <div key={i} className="shimmer h-4 rounded-lg" style={{ width: `${w}%` }} />
                    ))}
                    <div className="pt-4 pb-2">
                        <div className="shimmer h-6 rounded-lg w-56 mb-3" />
                    </div>
                    {[90, 80, 70, 60].map((w, i) => (
                        <div key={i} className="shimmer h-4 rounded-lg" style={{ width: `${w}%` }} />
                    ))}
                    {/* Vote section */}
                    <div className="shimmer h-20 rounded-2xl w-full mt-6" />
                </div>
            </div>

            {/* Related docs */}
            <div>
                <div className="shimmer h-6 rounded-lg w-64 mb-5" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-[#162918] p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
                            <div className="shimmer h-5 rounded-full w-20" />
                            <div className="shimmer h-5 rounded-lg w-full" />
                            <div className="shimmer h-5 rounded-lg w-4/5" />
                            <div className="shimmer h-3.5 rounded-lg w-full mt-1" />
                            <div className="shimmer h-3.5 rounded-lg w-3/4" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </>
);

/* ═══════════════════════════════════════════════════════════════
   4. Skeleton Grid Kategori
═══════════════════════════════════════════════════════════════ */
export const SkeletonCategoryGrid = () => (
    <>
        <ShimmerStyle />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-[#162918] rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col gap-4">
                    <div className="shimmer w-14 h-14 rounded-2xl" />
                    <div className="shimmer h-6 rounded-lg w-4/5" />
                    <div className="space-y-2">
                        <div className="shimmer h-4 rounded-lg w-full" />
                        <div className="shimmer h-4 rounded-lg w-5/6" />
                        <div className="shimmer h-4 rounded-lg w-3/4" />
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="shimmer h-3.5 rounded-lg w-32" />
                        <div className="shimmer h-4 w-4 rounded-full" />
                    </div>
                </div>
            ))}
        </div>
    </>
);