'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Member } from '@/types/types';
import type { Witness } from '@/types/types';

export default function HomePage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [changeType, setChangeType] = useState<'add' | 'remove'>('add');
  const [amount, setAmount] = useState<number | ''>(1);
  const [reason, setReason] = useState<string>('');
  const [selectedWitnesses, setSelectedWitnesses] = useState<string[]>([]);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | '' }>({ message: '', type: '' });
  const [otherWitnessValue, setOtherWitnessValue] = useState('');

  useEffect(() => {
    async function fetchData() {
      // Hämta BARA aktiva medlemmar
      const { data: memberData } = await supabase
        .from('members')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (memberData) setMembers(memberData);

      const { data: witnessData } = await supabase.from('witnesses').select('*').order('name');
      if (witnessData) setWitnesses(witnessData);
    }
    fetchData();
  }, []);


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


  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-5xl font-serif font-bold text-center mb-8 text-essex-gold drop-shadow-lg">Shot-Protokoll</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card-white text-gray-800 p-8 rounded-xl shadow-2xl border border-gray-200/10">
        
        <div>
          <label htmlFor="member" className="block text-lg font-semibold mb-2 text-gray-800">Vem gäller det?</label>
          <select id="member" value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)} required
            className="w-full bg-white border border-gray-400 rounded-md p-3 text-lg focus:ring-essex-gold focus:border-essex-gold shadow-sm">
            <option value="" disabled>Välj en medlem...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.current_shots} shots)</option>)}
          </select>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-semibold mb-2 text-gray-800">Typ av ändring (+/-)</label>
              <div className="flex items-center space-x-6 mt-3">
                <label className="flex items-center cursor-pointer"><input type="radio" name="changeType" value="add" checked={changeType === 'add'} onChange={() => setChangeType('add')} className="h-5 w-5 text-green-600 focus:ring-green-500"/><span className="ml-2 text-lg">Lägg till</span></label>
                <label className="flex items-center cursor-pointer"><input type="radio" name="changeType" value="remove" checked={changeType === 'remove'} onChange={() => setChangeType('remove')} className="h-5 w-5 text-essex-red focus:ring-essex-red"/><span className="ml-2 text-lg">Ta bort</span></label>
              </div>
            </div>
            <div>
              <label htmlFor="amount" className="block text-lg font-semibold mb-2 text-gray-800">Antal</label>
              <input type="number" id="amount" value={amount}
                placeholder="Skriv antal..."
                className="w-full bg-white border border-gray-400 rounded-md p-3 text-lg focus:ring-essex-gold focus:border-essex-gold shadow-sm no-spinner"
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                onBlur={() => { if (Number(amount) < 1) setAmount(1); }}
                min="1" required />
            </div>
        </div>

        <div>
          <label className="block text-lg font-semibold mb-2 text-gray-800">Vittnen</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            {witnesses.map(w => (
              <label key={w.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-200"><input type="checkbox" checked={selectedWitnesses.includes(w.name)} onChange={() => handleWitnessChange(w.name)} className="h-4 w-4 text-essex-red rounded border-gray-300 focus:ring-essex-red"/><span className="font-medium">{w.name}</span></label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="otherWitness" className="block text-lg font-semibold mb-2 text-gray-800">Annat vittne?</label>
          <input type="text" id="otherWitness" placeholder="Skriv namn på övrigt vittne..." value={otherWitnessValue} onChange={(e) => setOtherWitnessValue(e.target.value)}
            className="w-full bg-white border border-gray-400 rounded-md p-3 text-lg focus:ring-essex-gold focus:border-essex-gold shadow-sm" />
        </div>

        <div>
          <label htmlFor="reason" className="block text-lg font-semibold mb-2 text-gray-800">Anledning</label>
          <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Skriv anledning här..."
            className="w-full bg-white border border-gray-400 rounded-md p-3 text-lg focus:ring-essex-gold focus:border-essex-gold shadow-sm"></textarea>
        </div>

        <div className="pt-4">
            <button type="submit" className="w-full bg-essex-red text-white font-bold text-xl py-3 rounded-lg bg-green-600 hover:bg-green-800 transition-all duration-300 transform hover:scale-105">
                ♣ Registrera Händelse ♥
            </button>
        </div>

        {status.message && ( <p className={`text-center p-3 rounded-md mt-4 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-essex-red'}`}>{status.message}</p> )}
      </form>
    </div>
  );
}