'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import Link from 'next/link';
import type { Member } from '@/types/types';

// Kort-komponenten med den nya 3D-animationen
function MemberCard({ member, index }: { member: Member, index: number }) {
  const getSuitForRank = (rank: number): string => {
    const suits = ['♥', '♠', '♦', '♣'];
    return suits[rank % suits.length];
  };

  return (
    <Link href={`/person/${member.id}`} className="card-container">
      <div
        className="member-card bg-card-white text-gray-800 rounded-xl shadow-md border border-gray-200 p-5 flex flex-col justify-between h-full"
      >
        
        <div className="flex justify-between items-start font-bold text-gray-900 text-3xl">
          <div className="text-center leading-none">
              <span>A</span>
              <span className={index % 2 === 0 ? 'text-essex-red' : ''}>{getSuitForRank(index)}</span>
          </div>
          <div className="text-center leading-none transform rotate-180">
              <span>A</span>
              <span className={index % 2 === 0 ? 'text-essex-red' : ''}>{getSuitForRank(index)}</span>
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
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-gray-200 rounded-xl shadow-md p-5 flex flex-col justify-between animate-pulse">
        <div className="flex justify-between items-start text-gray-400 text-3xl">
            <span></span><span></span>
        </div>
        <div className="text-center my-6">
            <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto"></div>
            <div className="h-16 bg-gray-400 rounded w-1/3 mx-auto mt-4"></div>
            <div className="h-6 bg-gray-300 rounded w-1/2 mx-auto mt-2"></div>
        </div>
        <div className="flex justify-between items-end text-sm font-semibold text-gray-400">
            <span></span><span></span>
        </div>
    </div>
  );
}

export default function StandingsPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getStandings() {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('current_shots', { ascending: false });

      if (fetchError) {
        console.error('Error fetching standings:', fetchError);
        setError('Kunde inte hämta ställningen. Försök igen senare.');
      } else {
        setMembers(data);
      }
      setIsLoading(false);
    }

    getStandings();
  }, []);

  const kexMembers = members.filter(m => m.group_type === 'Kex');
  const essMembers = members.filter(m => m.group_type === 'ESS');

  return (
    <div>
      <h1 className="text-5xl font-serif font-bold text-center mb-12 text-essex-gold drop-shadow-lg">Skuldligan</h1>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <LoadingSkeleton key={i} />)}
        </div>
      ) : error ? (
        <p className="text-center text-red-600 bg-red-50 p-4 rounded-md">{error}</p>
      ) : members.length === 0 ? (
        <div className="text-center text-gray-400 bg-gray-900/50 p-8 rounded-lg">
          <p className="text-xl">Inga medlemmar har lagts till än.</p>
          <p className="mt-2">Gå till adminpanelen för att lägga till den första medlemmen.</p>
        </div>
      ) : (
        <>
          {/* --- SEKTION FÖR KEX --- */}
          {kexMembers.length > 0 && (
            <section className="mb-16">
              <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-gray-800 border-b-2 border-essex-gold pb-2">KEX</h2>
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
              <h2 className="text-4xl font-serif font-semibold text-center mb-6 text-gray-800 border-b-2 border-essex-gold pb-2">ESS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {essMembers.map((member, index) => (
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