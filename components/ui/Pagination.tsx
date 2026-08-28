"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  queryParamName?: string;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 12,
  queryParamName = "page",
  className = "",
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  // Helper to build page link preserving existing search filters
  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber === 1) {
      params.delete(queryParamName);
    } else {
      params.set(queryParamName, pageNumber.toString());
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  };

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // how many pages around current page

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push("...");
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push("...");
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalCount ? Math.min(currentPage * pageSize, totalCount) : currentPage * pageSize;

  return (
    <nav
      aria-label="Sayfalama"
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-200 mt-8 ${className}`}
    >
      {/* Ürün Sayısı Bilgisi */}
      {totalCount !== undefined ? (
        <p className="text-xs sm:text-sm text-gray-500 font-medium order-2 sm:order-1">
          Toplam <span className="font-extrabold text-gray-900">{totalCount}</span> üründen{" "}
          <span className="font-extrabold text-blue-600">{startItem}-{endItem}</span> arası gösteriliyor
        </p>
      ) : (
        <div className="order-2 sm:order-1" />
      )}

      {/* Sayfa Butonları */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* Önceki Sayfa Butonu */}
        {currentPage > 1 ? (
          <Link
            href={createPageUrl(currentPage - 1)}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs min-h-[40px]"
            aria-label="Önceki Sayfa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Önceki</span>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gray-100 text-gray-400 border border-gray-100 cursor-not-allowed min-h-[40px]"
            aria-disabled="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Önceki</span>
          </button>
        )}

        {/* Numaralandırılmış Sayfa Butonları */}
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-400 select-none"
              >
                •••
              </span>
            );
          }

          const pageNum = page as number;
          const isCurrent = pageNum === currentPage;

          return (
            <Link
              key={`page-${pageNum}`}
              href={createPageUrl(pageNum)}
              aria-current={isCurrent ? "page" : undefined}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center transition-all min-h-[36px] min-w-[36px] ${
                isCurrent
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 pointer-events-none"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-2xs"
              }`}
            >
              {pageNum}
            </Link>
          );
        })}

        {/* Sonraki Sayfa Butonu */}
        {currentPage < totalPages ? (
          <Link
            href={createPageUrl(currentPage + 1)}
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-2xs min-h-[40px]"
            aria-label="Sonraki Sayfa"
          >
            <span className="hidden sm:inline">Sonraki</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-gray-100 text-gray-400 border border-gray-100 cursor-not-allowed min-h-[40px]"
            aria-disabled="true"
          >
            <span className="hidden sm:inline">Sonraki</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </nav>
  );
}
