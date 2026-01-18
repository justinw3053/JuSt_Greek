"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/solid';

// Web worker for PDF.js needed for Next.js
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

interface PDFViewerProps {
    file: string;
    page: number;
}

export default function PDFViewer({ file, page }: PDFViewerProps) {
    const router = useRouter();
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState(1.0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const changePage = (offset: number) => {
        const newPage = page + offset;
        if (newPage >= 1 && (numPages === 0 || newPage <= numPages)) {
            router.replace(`/pdf?page=${newPage}`, { scroll: false });
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-2 sm:gap-4 bg-gray-900/90 backdrop-blur-md p-2 sm:p-3 rounded-full border border-white/10 sticky top-20 z-50 shadow-xl transition-all">

                {/* Navigation */}
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 sm:pr-4">
                    <button
                        onClick={() => changePage(-1)}
                        disabled={page <= 1}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <span className="text-sm font-medium text-white min-w-[30px] text-center">
                        {page}
                    </span>
                    <button
                        onClick={() => changePage(1)}
                        disabled={numPages > 0 && page >= numPages}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full transition-colors"
                    >
                        <MagnifyingGlassMinusIcon className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-medium text-blue-400 min-w-[40px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => setScale(s => Math.min(3.0, s + 0.1))}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-full transition-colors"
                    >
                        <MagnifyingGlassPlusIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Document */}
            <div className="border border-white/10 shadow-2xl rounded-lg overflow-hidden bg-white/5 min-h-[600px] w-full flex justify-center">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-white p-20 animate-pulse flex flex-col items-center gap-4">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading Page...</span>
                    </div>}
                    error={<div className="text-red-400 p-20 text-center">
                        <p className="font-bold">Failed to load PDF.</p>
                        <p className="text-sm opacity-80 mt-2">Please check your internet connection.</p>
                    </div>}
                    className="max-w-full"
                >
                    <Page
                        pageNumber={page}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="max-w-full shadow-lg"
                        loading=""
                    />
                </Document>
            </div>

            <p className="text-gray-500 text-sm mt-4">
                {numPages > 0 ? `Page ${page} of ${numPages}` : `Page ${page}`}
            </p>
        </div>
    );
}
