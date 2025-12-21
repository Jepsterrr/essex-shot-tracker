"use client";

import { useState } from "react";
import type { ShotLog } from "@/types/types";

const ITEMS_PER_PAGE = 15;

interface PaginatedLogTableProps {
  logs: ShotLog[];
  anchorId?: string;
}

export default function PaginatedLogTable({ logs, anchorId }: PaginatedLogTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const sortedLogs = logs.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const totalPages = Math.ceil(sortedLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = sortedLogs.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const scrollToAnchor = () => {
    if (anchorId) {
      const element = document.getElementById(anchorId);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }, 50);
      }
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      scrollToAnchor();
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      scrollToAnchor();
    }
  }

  if (logs.length === 0) {
    return (
      <p className="text-center text-gray-200 py-12 border">
        Inga händelser har loggats för denna medlem.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-500/40 hidden lg:table-header-group">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6"
              >
                Datum
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-center text-sm font-semibold text-gray-200"
              >
                Ändring
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200"
              >
                Anledning
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-200"
              >
                Vittnen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-500 bg-gray-600/40">
            {paginatedLogs.map((log) => (
              <tr
                key={log.id}
                className="block lg:table-row mb-4 lg:mb-0 text-gray-50 transition-colors even:bg-gray-600/35"
              >
                <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-4 lg:pr-3 lg:whitespace-nowrap sm:pl-6">
                  <span className="font-bold lg:hidden mr-2">Datum</span>
                  <span className="text-sm text-right lg:text-left ml-2">
                    {new Date(log.created_at).toLocaleString("sv-SE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Europe/Stockholm",
                    })}
                  </span>
                </td>
                <td
                  className={`flex justify-between items-center p-3 lg:table-cell lg:px-3 lg:py-4 lg:whitespace-nowrap lg:text-center font-bold ${
                    log.change > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  <span className="font-bold lg:hidden mr-2">Ändring</span>
                  <span>{log.change > 0 ? `+${log.change}` : log.change}</span>
                </td>
                <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4 lg:items-center">
                  <span className="font-bold lg:hidden mr-2">Anledning</span>
                  <span className="text-right lg:text-left text-sm break-words">
                    {log.reason || "-"}
                  </span>
                </td>
                <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4 lg:items-center">
                  <span className="font-bold lg:hidden mr-2 pt-0.5">
                    Vittnen
                  </span>
                  <span className="text-right lg:text-left text-sm break-words">
                    {log.witnesses?.join(", ") || "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginering-knappar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Föregående
          </button>
          <span className="text-sm font-semibold text-gray-200">
            Sida {currentPage} av {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300"
          >
            Nästa
          </button>
        </div>
      )}
    </>
  );
}
