"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DeleteButtonProps {
    logId: string;
    memberName: string;
    change: number;
}

export default function DeleteButton({ logId, memberName, change }: DeleteButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const confirmMessage = `Är du säker på att du vill TA BORT händelsen för ${memberName}?\n\nDetta kommer att:\n1. Ta bort loggen permanent\n2. Återställa saldot (${change > 0 ? "dra av" : "lägga tillbaka"} ${Math.abs(change)} shots)`;
    
        if (!window.confirm(confirmMessage)) return;

        setIsDeleting(true);
        try {
                const res = await fetch(`/api/revert-shot?id=${logId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(`Kunde inte ta bort: ${data.error}`)
            } else {
                const actionDescription = change > 0 ? "Straff borttaget" : "Drickning ångrad";
                toast.success(`${actionDescription} för ${memberName}`, {
                    style: {
                        background: '#333',
                        color: '#fff',
                        border: '1px solid #d4af37',
                    }
                });

                router.refresh();
            }
        } catch (error) {
            toast.error("Ett fel uppstod vid borttagning.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-700/50"
            title="Ångra händelse"
        >
            {isDeleting ? (
                <span className="animate-spin inline-block">↻</span>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
            )}
        </button>
    );
}