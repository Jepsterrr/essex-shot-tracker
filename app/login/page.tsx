'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin/medlemmar';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        username,
        password,
        callbackUrl
      });

      if (res?.error) {
        setError('Felaktigt användarnamn eller lösenord. Försök igen.');
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('Ett oväntat fel inträffade.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-felt-green-dark p-4">
      <div className="w-full max-w-md">
        <div className="bg-card-white border-2 border-gray-300 rounded-xl shadow-2xl">
          <div className="p-8 md:p-12">
            <div className="flex justify-center mb-6">
              <Image src="/logo.png" alt="Essex Logo" width={200} height={100} />
            </div>
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Admininloggning</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Användarnamn</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-essex-gold focus:border-essex-gold"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Lösenord</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-essex-gold focus:border-essex-gold"
                />
              </div>
              
              {error && <p className="text-sm text-center text-essex-red">{error}</p>}
              
              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-essex-gold transition-colors"
                >
                  Logga in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}