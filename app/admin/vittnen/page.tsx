'use client';

import { useState, useEffect, FormEvent } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';
import type { Witness } from '@/types/types';

export default function AdminWitnessesPage() {
  const [witnesses, setWitnesses] = useState<Witness[]>([]);
  const [newName, setNewName] = useState('');
  const [status, setStatus] = useState('');
  const router = useRouter();
  const [editingWitnessId, setEditingWitnessId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  async function fetchWitnesses() {
    const { data } = await supabase.from('witnesses').select('*').order('name');
    if (data) setWitnesses(data);
  }

  useEffect(() => {
    fetchWitnesses();
  }, []);

  const handleAddWitness = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch('/api/witnesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (!res.ok) {
        const { error } = await res.json();
        setStatus(`Kunde inte lägga till vittne: ${error}`);
    } else {
      setNewName('');
      setStatus(`Vittne "${newName.trim()}" tillagt!`);
      await fetchWitnesses();
      router.refresh();
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleDeleteWitness = async (id: string, name: string) => {
    if (!window.confirm(`Är du säker på att du vill ta bort vittnet ${name}?`)) return;
    const res = await fetch(`/api/witnesses?id=${id}`, { method: 'DELETE' });
    if (!res.ok) {
        const { error } = await res.json();
        setStatus(`Kunde inte ta bort vittne: ${error}`);
    } else {
      setStatus(`Vittne "${name}" borttaget!`);
      await fetchWitnesses();
      router.refresh();
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleEditClick = (witness: Witness) => {
    setEditingWitnessId(witness.id);
    setEditingName(witness.name);
  };

  const handleCancelClick = () => {
    setEditingWitnessId(null);
    setEditingName('');
  };

  const handleSaveClick = async (id: string) => {
    if (!editingName.trim()) return;
    const res = await fetch('/api/witnesses', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, newName: editingName.trim() }),
    });
    if (!res.ok) {
        const { error } = await res.json();
        setStatus(`Kunde inte uppdatera: ${error}`);
    } else {
      setStatus(`Namn uppdaterat!`);
      setEditingWitnessId(null);
      setEditingName('');
      await fetchWitnesses();
      router.refresh();
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-card-white text-gray-800 rounded-xl shadow-2xl border border-gray-300">
      <div className="p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-2">Hantera Vittnen</h1>
        <p className="text-gray-600 mb-6 md:mb-8">Lägg till, redigera eller ta bort personer i vittneslistan.</p>
        
        {/* Sektion för att lägga till nytt vittne */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-800">Lägg till nytt vittne</h2>
          <form onSubmit={handleAddWitness}>
            <label htmlFor="newName" className="block text-sm font-medium text-gray-700 sr-only">Namn</label>
            <div className="mt-1 flex flex-col sm:flex-row gap-3">
              <input 
                type="text" id="newName" value={newName} onChange={e => setNewName(e.target.value)}
                className="flex-grow w-full bg-white border border-gray-400 rounded-md p-2 focus:ring-essex-gold focus:border-essex-gold shadow-sm"
                placeholder="Vittnets namn..." required 
              />
              <button type="submit" className="w-full sm:w-auto flex-shrink-0 bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors">
                Lägg till
              </button>
            </div>
          </form>
        </div>

        {/* Sektion för nuvarande vittnen */}
        <div className="mt-10">
          <h2 className="text-lg md:text-xl font-bold mb-3 text-gray-800">Nuvarande vittnen</h2>
          {status && <p className="mb-4 text-center text-sm p-3 bg-gray-100 rounded-md">{status}</p>}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {witnesses.map(witness => (
                <li key={witness.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 gap-3">
                  <div className="flex-grow mb-2 sm:mb-0">
                    {editingWitnessId === witness.id ? (
                      <input 
                        type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)}
                        className="w-full bg-white border border-gray-400 rounded-md p-1" autoFocus />
                    ) : (
                      <span className="p-1 font-medium">{witness.name}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                    {editingWitnessId === witness.id ? (
                      <>
                        <button onClick={() => handleSaveClick(witness.id)} className="bg-green-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-green-500">Spara</button>
                        <button onClick={handleCancelClick} className="bg-gray-500 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-gray-400">Avbryt</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEditClick(witness)} className="text-gray-600 font-semibold text-xs py-1 px-3 rounded-md hover:bg-gray-100">Redigera</button>
                        <button onClick={() => handleDeleteWitness(witness.id, witness.name)} className="text-white bg-red-600 font-semibold text-xs py-1 px-3 rounded-md hover:bg-red-700">Ta bort</button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}