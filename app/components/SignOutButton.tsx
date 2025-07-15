'use client';

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function SignOutButton() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div className="w-24 h-8 bg-gray-700 rounded animate-pulse"></div>;
    }

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-sm text-gray-400">Inloggad som {(session.user)?.username}</span>
                <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="bg-essex-red text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                    Logga ut
                </button>
            </div>
        );
    }

    return (
        <Link href="/login" className="text-white font-bold py-2 px-4 rounded hover:bg-gray-600 transition-colors">
            Logga in
        </Link>
    );
}