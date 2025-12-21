"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
    elementId: string;
}

export default function ScrollToTopOnParams({ elementId }: Props) {
    const searchParams = useSearchParams();
    const currentPage = searchParams.get("page") || "1";
    const previousPage = useRef(currentPage);

    useEffect(() => {
        if (previousPage.current !== currentPage) {
            const element = document.getElementById(elementId);

            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }, 100);
            }

            previousPage.current = currentPage;
        }
    }, [currentPage, elementId]);

    return null;
}