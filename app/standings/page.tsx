import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Member } from '@/types/types';

// Kort-komponenten
function MemberCard({ member, index }: { member: Member, index: number }) {
  const rank = index + 1;
  const suits = ['♥', '♠', '♦', '♣'];
  const suit = suits[(rank - 1) % suits.length]; 
  const colorClass = suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-gray-200';

  const getCardValue = (r: number): string => {
    const effectiveRank = ((r - 1) % 13) + 1;

    if (effectiveRank === 1) return 'A';
    if (effectiveRank >= 2 && effectiveRank <= 10) return effectiveRank.toString();

    const faceCards: Record<number, string> = {
      11: 'J',
      12: 'Q',
      13: 'K'
    };
    
    return faceCards[effectiveRank];
  }
  const cardValue = getCardValue(rank)

  return (
    <Link href={`/person/${member.id}`} className="card-container">
      <div className="member-card bg-card-white text-gray-600 rounded-xl p-4 flex flex-col justify-between h-full card-inner-border">

        {/* Stor symbol i bakgrunden */}
        <div className={`absolute inset-0 flex items-center justify-center text-[12rem] ${colorClass} opacity-10 font-serif select-none`}>
          {suit}
        </div>

        {/* Övre vänstra hörnet */}
        <div className={`absolute top-4 left-4 text-center leading-none font-bold text-2xl ${colorClass}`}>
          <div>{cardValue}</div>
          <div>{suit}</div>
        </div>
        
        {/* Nedre högra hörnet */}
        <div className={`absolute bottom-4 right-4 text-center leading-none font-bold text-2xl ${colorClass} transform rotate-180`}>
          <div>{cardValue}</div>
          <div>{suit}</div>
        </div>

        {/* Centrerat innehåll */}
        <div className="text-center my-auto relative z-10">
          <p className="text-3xl font-serif font-bold text-gray-400">{member.name}</p>
          <p className="text-6xl font-bold text-essex-red mt-2 drop-shadow">
            {member.current_shots}
          </p>
          <p className="text-lg text-gray-400">straffshots</p>
        </div>

      </div>
    </Link>
  );
}

async function getStandings(): Promise<Member[]> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('is_active', true)
    .order('current_shots', { ascending: false });
  
  if (error) {
    console.error('Error fetching standings:', error);
    throw new Error('Kunde inte hämta ställningen.');
  }
  
  return data || [];
}

export default async function StandingsPage() {
  const members = await getStandings();
  
  const kexMembers = members.filter(m => m.group_type === 'Kex');
  const essMembers = members.filter(m => m.group_type === 'ESS');
  const jokerMembers = members.filter(m => m.group_type === 'Joker');

  return (
    <div>
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">Skuldligan</h1>
      
      {members.length === 0 ? (
        <div className="text-center text-gray-400 bg-gray-900/50 p-8 rounded-lg">
          <p className="text-xl">Inga medlemmar har lagts till än.</p>
          <p className="mt-2">Gå till adminpanelen för att lägga till den första medlemmen.</p>
        </div>
      ) : (
        <>
          {/* --- SEKTION FÖR KEX --- */}
          {kexMembers.length > 0 && (
            <section className="mb-16">
              <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-gray-300 border-b-2 border-amber-400 pb-2">KEX</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {kexMembers.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* --- SEKTION FÖR ESS --- */}
          {essMembers.length > 0 && (
            <section>
              <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-gray-300 border-b-2 border-red-400 pb-2">ESS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {essMembers.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} />
                ))}
              </div>
            </section>
          )}

          {jokerMembers.length > 0 && (
            <section>
              <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-gray-300 border-b-2 border-purple-400 pb-2">Joker</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jokerMembers.map((member, index) => (
                  <MemberCard key={member.id} member={member} index={index} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
