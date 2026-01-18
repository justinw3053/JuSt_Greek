"use client";

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

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
    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState(1.0);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-md p-3 rounded-full border border-white/10 sticky top-4 z-50 shadow-xl">
                <button
                    onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                    className="w-10 h-10 flex items-center justify-center text-white bg-white/10 rounded-full hover:bg-white/20"
                >
                    -
                </button>
                <span className="text-sm font-medium text-blue-400 min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                </span>
                <button
                    onClick={() => setScale(s => Math.min(3.0, s + 0.1))}
                    className="w-10 h-10 flex items-center justify-center text-white bg-white/10 rounded-full hover:bg-white/20"
                >
                    +
                </button>
            </div>

            {/* Document */}
            <div className="border border-white/10 shadow-2xl rounded-lg overflow-hidden bg-white/5">
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="text-white p-10 animate-pulse">Loading PDF...</div>}
                    error={<div className="text-red-400 p-10">Failed to load PDF.</div>}
                    className="max-w-full"
                >
                    <Page
                        pageNumber={page}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="max-w-full"
                    />
                </Document>
            </div>

            <p className="text-gray-500 text-sm mt-4">
                Viewing Page {page} of {numPages}
            </p>
        </div>
    );
}
