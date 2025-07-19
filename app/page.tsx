'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Member } from '@/types/types';
import type { Witness } from '@/types/types';

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [allWitnessOptions, setAllWitnessOptions] = useState<Witness[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [changeType, setChangeType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState<number | ''>(1);
  const [reason, setReason] = useState<string>('');
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [otherWitnessValue, setOtherWitnessValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      // Hämta BARA aktiva medlemmar
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (memberData) setMembers(memberData);

      // Hämta manuellt tillagda vittnen från 'witnesses'-tabellen
      const { data: witnessData } = await supabase.from('witnesses').select('*').order('name');

      const memberWitnesses: Witness[] = (memberData || [])
        .filter(m => m.group_type === 'ESS' || m.group_type === 'Joker')
        .map(m => ({ id: m.id, name: m.name }));
      
      // Slå ihop de manuella vittnena med de kvalificerade medlemmarna
      const combined = [...(witnessData || []), ...memberWitnesses];
      
      // Ta bort eventuella dubbletter om en medlem också finns i den manuella listan
      const uniqueWitnesses = Array.from(new Map(combined.map(item => [item.name, item])).values());

      setAllWitnessOptions(uniqueWitnesses.sort((a, b) => a.name.localeCompare(b.name)));
    }
    fetchData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus({ message: '', type: '' });

    if (!selectedMemberId || Number(amount) <= 0) {
      setStatus({ message: 'Välj en medlem och ange ett antal större än noll.', type: 'error' });
      return;
    }

    const selectedMember = members.find(m => m.id === selectedMemberId);
    if (!selectedMember) {
        setStatus({ message: 'Kunde inte hitta medlemsdata.', type: 'error' });
        return;
    }

    const changeAmount = changeType === 'add' ? Number(amount) : -Number(amount);

    const finalWitnesses = [...selectedWitnesses];
    if (otherWitnessValue.trim()) {
      finalWitnesses.push(`Övrig: ${otherWitnessValue.trim()}`);
    }

    const res = await fetch('/api/log-shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            member_id: selectedMemberId,
            change: changeAmount,
            reason,
            witnesses: finalWitnesses,
            group_type: selectedMember.group_type
        })
    });

    if (!res.ok) {
        const errorData = await res.json();
        setStatus({ message: `Något gick fel: ${errorData.error || res.statusText}`, type: 'error' });
    } else {
        setStatus({ message: 'Shots loggade! Sidan kommer att laddas om.', type: 'success' });
        setTimeout(() => window.location.reload(), 1500);
    }
  };
  
  const handleWitnessChange = (memberName: string) => {
    setSelectedWitnesses(prev => 
      prev.includes(memberName) 
        ? prev.filter(w => w !== memberName) 
        : [...prev, memberName]
    );
  };

  const selectedMemberName = members.find(m => m.id === selectedMemberId)?.name || "Välj en medlem...";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-5xl font-serif font-bold text-center mb-8 text-essex-gold drop-shadow-lg">Shot-Protokoll</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card-white text-gray-200 p-8 rounded-xl shadow-2xl border border-gray-200/10">
        
        <div>
          <label htmlFor="member" className="block text-lg font-semibold mb-2 text-gray-200">Vem gäller det?</label>

          <div className="relative" ref={dropdownRef}>
            <div
              className={`
                form-select
                w-full rounded-md border-2 transition-all duration-200
                ${isDropdownOpen 
                  ? 'border-amber-300/70 shadow-lg' 
                  : 'border-gray-400 hover:border-gray-500'
                }
              `}
            >
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full p-3 text-lg text-left grid grid-cols-[1fr_auto] items-center gap-4"
              >
                <span className="truncate">{selectedMemberName}</span>
                <span className="flex items-center">
                  <svg className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                </span>
                </button>
              
              {isDropdownOpen && (
                <ul className="w-full bg-gray-700 overflow-auto border-t-2 border-amber-300/70">
                  {members.map(member => (
                    <li
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberId(member.id);
                        setIsDropdownOpen(false);
                      }}
                      className="p-3 text-white text-lg cursor-pointer hover:bg-gray-500"
                    >
                      {member.name} 
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-200">Typ av ändring (+/-)</label>
              <div className="flex items-center space-x-6 mt-3">
                <label className="flex items-center cursor-pointer"><input type="radio" name="changeType" value="add" checked={changeType === 'add'} onChange={() => setChangeType('add')} className="form-radio value-add h-5 w-5"/><span className="ml-2 text-lg">Lägg till</span></label>
                <label className="flex items-center cursor-pointer"><input type="radio" name="changeType" value="remove" checked={changeType === 'remove'} onChange={() => setChangeType('remove')} className="form-radio value-remove h-5 w-5"/><span className="ml-2 text-lg">Ta bort</span></label>
              </div>
            </div>
            <div>
              <label htmlFor="amount" className="block text-lg font-semibold mb-2 text-gray-200">Antal</label>
              <input type="number" id="amount" value={amount}
                placeholder="Skriv antal..."
                className="form-input w-full bg-white border border-gray-400 rounded-md p-3 text-lg shadow-sm no-spinner"
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={() => { if (Number(amount) < 1) setAmount(1); }}
                min="1" required />
            </div>
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-200">Vittnen</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-600/40 border border-gray-200 rounded-lg">
            {allWitnessOptions.map(w => (
              <label key={w.id} className="flex items-center space-x-2 cursor-pointer text-white p-2 rounded hover:bg-gray-600">
                <input
                  type="checkbox"
                  checked={selectedWitnesses.includes(w.name)}
                  onChange={() => handleWitnessChange(w.name)}
                  className="form-checkbox"
                />
                <span className="font-medium">{w.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="otherWitness" className="block text-lg font-semibold mb-2 text-gray-300">Annat vittne?</label>
          <input type="text" id="otherWitness" placeholder="Skriv namn på övrigt vittne..." value={otherWitnessValue} onChange={(e) => setOtherWitnessValue(e.target.value)}
            className="form-input w-full bg-white border border-gray-400 rounded-md p-3 text-lg shadow-sm" />
        </div>

        <div>
          <label htmlFor="reason" className="block text-lg font-semibold mb-2 text-gray-300">Anledning</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Skriv anledning här..."
            className="form-input w-full bg-white border border-gray-400 rounded-md p-3 text-lg shadow-sm"></textarea>
        </div>

        <div className="pt-4">
            <button 
              type="submit" 
              className="w-full text-white font-serif tracking-wider font-bold text-xl py-3 rounded-lg bg-essex-red hover:border-7 transition-all duration-300 transform hover:scale-105 border-b-3 border-t-3 border-red-900 active:border-b-2 active:scale-100"
            >
                ♣ Registrera Händelse ♥
            </button>
        </div>

        {status.message && ( <p className={`text-center p-3 rounded-md mt-4 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-essex-red'}`}>{status.message}</p> )}
      </form>
    </div>
  );
}