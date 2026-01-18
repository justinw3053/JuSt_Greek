"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), {
    ssr: false,
    loading: () => <div className="text-white p-10 text-center">Loading PDF Viewer...</div>
});

// Suspense wrapper for search params
function ViewerContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam) : 1;
    const file = "/assets/grammar.pdf"; // Hardcoded for now as it's the only asset

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="font-bold text-lg">Grammar Reference</h1>
            </div>

            <div className="pt-4">
                <PDFViewer file={file} page={page} />
            </div>
        </div>
    );
}

export default function PDFPage() {
    return (
        <Suspense fallback={<div className="text-white p-10 text-center">Loading...</div>}>
            <ViewerContent />
        </Suspense>
    );
}
