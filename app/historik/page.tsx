import { supabase } from "@/lib/supabase-client";
import type { ShotLog } from "@/types/types";
import Link from "next/link";
import SearchBar from "./SearchBar";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 25;

async function getHistory(currentPage: number, query: string | undefined) {
  const from = (currentPage - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let supabaseQuery = supabase.from("shot_log").select(
    `
      id, created_at, change, reason, witnesses,
      members ( name )
    `,
    { count: "exact" }
  );

  if (query) {
    const { data: matchingMembers } = await supabase
      .from("members")
      .select("id")
      .ilike("name", `%${query}%`);

    const memberIds = matchingMembers ? matchingMembers.map((m) => m.id) : [];

    const orConditions = [
      `reason.ilike.%${query}%`,
      ...(memberIds.length > 0
        ? [`member_id.in.(${memberIds.join(",")})`]
        : []),
    ].join(",");

    supabaseQuery = supabaseQuery.or(orConditions);
  }

  const { data, error, count } = await supabaseQuery
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching history:", error);
    throw new Error("Kunde inte hämta historiken.");
  }

  return { history: data as unknown as ShotLog[], totalCount: count || 0 };
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: any;
}) {
  const currentPage = Number(searchParams.page) || 1;
  const searchQuery = searchParams.query;
  const { history, totalCount } = await getHistory(currentPage, searchQuery);
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-200/10">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-300 mb-2">
          Händelselogg
        </h1>
        <p className="text-gray-400 mb-6 md:mb-8">
          Historik över alla registrerade shots.
        </p>

        {/* Sökfältet */}
        <div className="mb-6">
          <SearchBar placeholder="Sök på namn eller anledning..." />
        </div>

        <div className="border-t border-gray-400 pt-6">
          {history.length === 0 ? (
            <p className="text-center text-gray-200 py-12 border">
              {searchQuery
                ? `Inga händelser matchade din sökning "${searchQuery}".`
                : "Inga händelser har loggats än."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-500/40 hidden lg:table-header-group">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-200 sm:pl-6"
                      >
                        Person
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
                      <th
                        scope="col"
                        className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-200 sm:pr-6"
                      >
                        Datum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-500 bg-gray-600/40">
                    {history.map((log) => (
                      <tr
                        key={log.id}
                        className="block lg:table-row mb-4 lg:mb-0 text-gray-50 transition-colors even:bg-gray-600/35"
                      >
                        <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-4 lg:pr-3 lg:whitespace-nowrap sm:pl-6">
                          <span className="font-bold lg:hidden mr-2">
                            Person
                          </span>
                          <span className="text-right lg:text-left font-medium text-white ml-2">
                            {log.members?.name ?? "Raderad"}
                          </span>
                        </td>
                        <td
                          className={`flex justify-between items-center p-3 lg:table-cell lg:px-3 lg:py-4 lg:whitespace-nowrap lg:text-center font-bold ${
                            log.change > 0
                              ? "text-red-600"
                              : log.change < 0
                              ? "text-green-600"
                              : "text-gray-800"
                          }`}
                        >
                          <span className="font-bold lg:hidden mr-2">
                            Ändring
                          </span>
                          <span>
                            {log.change > 0 ? `+${log.change}` : log.change}
                          </span>
                        </td>
                        <td className="flex justify-between items-start p-3 lg:table-cell lg:px-3 lg:py-4 lg:items-center">
                          <span className="font-bold lg:hidden mr-2">
                            Anledning
                          </span>
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
                        <td className="flex justify-between items-center p-3 lg:table-cell lg:py-4 lg:pl-3 lg:pr-4 lg:whitespace-nowrap lg:text-right sm:pr-6">
                          <span className="font-bold lg:hidden mr-2">
                            Datum
                          </span>
                          <span className="text-sm">
                            {new Date(log.created_at).toLocaleString("sv-SE", {
                              hour: "2-digit",
                              minute: "2-digit",
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              timeZone: "Europe/Stockholm",
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginering-knappar är nu <Link>-taggar */}
              <div className="flex items-center justify-between mt-6">
                <Link
                  href={`/historik?page=${currentPage - 1}${
                    searchQuery ? "&query=" + searchQuery : ""
                  }`}
                  aria-disabled={currentPage <= 1}
                  className={`bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-300 ${
                    currentPage <= 1
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                >
                  Föregående
                </Link>
                <span className="text-sm font-semibold text-gray-200">
                  Sida {currentPage} av {totalPages}
                </span>
                <Link
                  href={`/historik?page=${currentPage + 1}${
                    searchQuery ? "&query=" + searchQuery : ""
                  }`}
                  aria-disabled={currentPage >= totalPages}
                  className={`bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-300 ${
                    currentPage >= totalPages
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : ""
                  }`}
                >
                  Nästa
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
