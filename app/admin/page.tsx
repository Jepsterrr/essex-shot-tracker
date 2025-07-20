import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function StatCard({ title, value, description }: { title: string, value: string | number, description: string }) {
    return (
        <div className="bg-gray-700/60 p-6 rounded-xl border border-gray-600">
            <p className="text-5xl font-bold text-essex-gold">{value}</p>
            <h3 className="text-xl font-semibold text-gray-200 mt-2">{title}</h3>
            <p className="text-gray-400">{description}</p>
        </div>
    );
}

function QuickLink({ href, title, description }: { href: string, title: string, description: string }) {
    return (
        <Link href={href} className="block bg-gray-700/60 p-6 rounded-xl hover:bg-gray-700/80 transition-colors border border-gray-600">
            <h3 className="text-xl font-semibold text-gray-200">{title} &rarr;</h3>
            <p className="text-gray-400 mt-1">{description}</p>
        </Link>
    );
}

async function getAdminStats() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const activeMembersPromise = supabase.from('members').select('current_shots').eq('is_active', true);
    const recentLogsPromise = supabase.from('shot_log').select('id', { count: 'exact' }).gte('created_at', sevenDaysAgo);

    const [{ data: members, error: membersError }, { count: recentLogsCount, error: logsError }] = await Promise.all([
        activeMembersPromise,
        recentLogsPromise
    ]);

    if (membersError || logsError) {
        console.error("Error fetching admin stats:", membersError || logsError);
    }

    const totalShots = members?.reduce((sum, member) => sum + member.current_shots, 0) || 0;

    return {
        activeMemberCount: members?.length || 0,
        totalShotDebt: totalShots,
        recentLogsCount: recentLogsCount || 0
    };
}

export default async function AdminDashboard() {
  const { activeMemberCount, totalShotDebt, recentLogsCount } = await getAdminStats();

  return (
    <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-serif font-bold text-gray-200 mb-2">Admin-översikt</h1>
        <p className="text-gray-400 mb-8">En överblick av systemet och snabblänkar för administration.</p>

        {/* --- Statistik --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StatCard title="Aktiva Medlemmar" value={activeMemberCount} description="Antal medlemmar som visas i listor." />
            <StatCard title="Total Skuld" value={totalShotDebt} description="Sammanlagd skuld för alla aktiva medlemmar." />
            <StatCard title="Nya Händelser" value={recentLogsCount} description="Antal loggade händelser senaste 7 dagarna." />
        </div>

        {/* --- Snabblänkar --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuickLink href="/admin/medlemmar" title="Hantera Medlemmar" description="Lägg till, redigera, arkivera och radera medlemmar." />
            <QuickLink href="/admin/vittnen" title="Hantera Externa Vittnen" description="Administrera listan över personer som inte är medlemmar." />
        </div>
    </div>
  );
}