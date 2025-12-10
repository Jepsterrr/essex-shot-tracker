"use client";

import { useState } from "react";
import type { ShotLog } from "@/types/types";

const ITEMS_PER_PAGE = 10;

interface WitnessLogTableProps {
  logs: ShotLog[];
}

export default function WitnessLogTable({ logs }: WitnessLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const sortedLogs = logs.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = sortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (logs.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8 italic border border-gray-600/30 rounded-lg bg-gray-800/20">
        Inga bevittnade händelser än.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-500/40 hidden lg:table-header-group">
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6">
                Datum
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                Mottagare
              </th>
              <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-200">
                Antal
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200">
                Anledning
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500 bg-gray-600/40">
            {paginatedLogs.map((log) => (
              <tr 
                key={log.id}
                className="block lg:table-row mb-4 lg:mb-0 text-gray-50 transition-colors even:bg-gray-600/35"
              >
                {/* Datum */}
                <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-4 lg:pr-3 lg:whitespace-nowrap sm:pl-6">
                  <span className="font-bold lg:hidden mr-2 text-gray-400 text-xs uppercase">Datum</span>
                  <span className="text-sm text-right lg:text-left">
                    {new Date(log.created_at).toLocaleString("sv-SE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </td>

                {/* Mottagare */}
                <td className="flex justify-between items-center p-3 lg:table-cell lg:px-3 lg:py-4">
                  <span className="font-bold lg:hidden mr-2 text-gray-400 text-xs uppercase">Mottagare</span>
                  <span className="text-right lg:text-left font-bold text-white">
                    {log.members?.name || "Okänd"}
                  </span>
                </td>

                {/* Antal */}
                <td className="flex justify-between items-center p-3 lg:table-cell lg:px-3 lg:py-4 lg:text-center">
                  <span className="font-bold lg:hidden mr-2 text-gray-400 text-xs uppercase">Antal</span>
                  <span className="font-bold text-amber-400 text-lg lg:text-base">
                    {log.change}
                  </span>
                </td>

                {/* Anledning */}
                <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4 lg:items-center">
                  <span className="font-bold lg:hidden mr-2 text-gray-400 text-xs uppercase pt-1">Anledning</span>
                  <span className="text-right lg:text-left text-sm text-gray-300 break-words max-w-xs">
                    {log.reason || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
          >
            Föregående
          </button>
          <span className="text-sm font-semibold text-gray-200">
            Sida {currentPage} av {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 text-sm"
          >
            Nästa
          </button>
        </div>
      )}
    </div>
  );
}