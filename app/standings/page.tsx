import { createClient } from '@supabase/supabase-js'
import type { Member } from '@/types/types';

async function getStandings(): Promise<Member[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('current_shots', { ascending: false });

  if (error) {
    console.error('Error fetching standings:', error);
    return [];
  }
  return data;
}

function getSuitForRank(rank: number): string {
    const suits = ['♠', '♥', '♦', '♣'];
    return suits[rank % suits.length];
}

function MemberCard({ member, index }: { member: Member, index: number }) {
  return (
    <div key={member.id} 
      className="bg-card-white text-gray-800 rounded-xl shadow-md border border-gray-200 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
      
      <div className="flex justify-between items-start font-bold text-gray-900 text-3xl">
        <div className="text-center leading-none">
            <span>A</span>
            <span className={index < 3 ? 'text-essex-red' : ''}>{getSuitForRank(index)}</span>
        </div>
        <div className="text-center leading-none transform rotate-180">
            <span>A</span>
            <span className={index < 3 ? 'text-essex-red' : ''}>{getSuitForRank(index)}</span>
        </div>
      </div>

      <div className="text-center my-6">
        <p className="text-3xl font-serif font-bold text-gray-900">{member.name}</p>
        <p className="text-6xl font-bold text-essex-red mt-2 drop-shadow">
          {member.current_shots}
        </p>
        <p className="text-lg text-gray-500">straffshots</p>
      </div>

      <div className="flex justify-between items-end text-sm font-semibold text-gray-400">
          <span># {index + 1}</span>
          <span>ESSEX</span>
      </div>
    </div>
  );
}

export default async function StandingsPage() {
  const members = await getStandings();
  const kexMembers = members.filter(m => m.group_type === 'Kex');
  const essMembers = members.filter(m => m.group_type === 'ESS');

  return (
    <div>
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">Skuldligan</h1>
      
      {members.length === 0 && (
        <div className="text-center text-gray-400 bg-gray-900/50 p-8 rounded-lg">
          <p className="text-xl">Inga medlemmar har lagts till än.</p>
          <p className="mt-2">Gå till adminpanelen för att lägga till den första medlemmen.</p>
        </div>
      )}

      {/* --- SEKTION FÖR KEX --- */}
      {kexMembers.length > 0 && (
        <section className="mb-16">
          <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-black border-b-2 border-essex-gold pb-2">KEX</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kexMembers.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* --- SEKTION FÖR ESS --- */}
      {essMembers.length > 0 && (
        <section>
          <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-black border-b-2 border-essex-gold pb-2">ESS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {essMembers.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
}