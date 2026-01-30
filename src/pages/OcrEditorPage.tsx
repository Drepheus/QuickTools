/**
 * OCR Document Editor
 * 
 * TODO: Implement real OCR using tesseract.js
 * @see https://github.com/naptha/tesseract.js
 * 
 * Currently using mock data for demonstration.
 */

import { useState, useRef } from 'react';
import {
    ScanText,
    Upload,
    Download,
    Copy,
    Trash2,
    Edit3,
    Check,
    Loader2,
    FileText,
    Image as ImageIcon
} from 'lucide-react';

interface ExtractedDocument {
    id: string;
    name: string;
    originalUrl: string;
    extractedText: string;
    editedText: string;
    status: 'pending' | 'processing' | 'done' | 'error';
}

// Mock extracted text for demo
const mockTexts = [
    `INVOICE #12345

Date: January 15, 2024
Due Date: February 15, 2024

Bill To:
John Smith
123 Main Street
New York, NY 10001

Description                     Amount
---------------------------------
Web Development Services       $2,500.00
UI/UX Design                   $1,200.00
Consulting (10 hours)            $750.00
---------------------------------
Subtotal                       $4,450.00
Tax (8%)                         $356.00
---------------------------------
TOTAL DUE                      $4,806.00

Payment Terms: Net 30
Thank you for your business!`,

    `RECEIPT

Store: QuickMart Grocery
Address: 456 Commerce Ave
Date: 01/20/2024 14:35

Items:
Organic Milk (1 gal)      $5.99
Whole Wheat Bread         $3.49
Free Range Eggs (12)      $6.99
Fresh Salmon (1 lb)      $12.99
Avocados (3)              $4.50
Greek Yogurt (32oz)       $7.49

Subtotal:               $41.45
Tax:                     $3.32
TOTAL:                  $44.77

Payment: VISA ****4242
Thank you for shopping!`,

    `EMPLOYMENT AGREEMENT

This Employment Agreement is entered into as of January 1, 2024, by and between ABC Corporation ("Employer") and Jane Doe ("Employee").

1. POSITION: Employee shall serve as Senior Software Engineer.

2. COMPENSATION: Base salary of $120,000 per year, paid bi-weekly.

3. BENEFITS: Health insurance, 401(k) matching, 20 days PTO.

4. TERM: This agreement shall commence on January 1, 2024.

Signatures:
_____________________
Employer Representative

_____________________
Employee`
];

export function OcrEditorPage() {
    const [documents, setDocuments] = useState<ExtractedDocument[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<ExtractedDocument | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(
            f => f.type.startsWith('image/') || f.type === 'application/pdf'
        );
        addDocuments(files);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            addDocuments(files);
        }
    };

    const addDocuments = async (files: File[]) => {
        const newDocs: ExtractedDocument[] = files.map(file => ({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            originalUrl: URL.createObjectURL(file),
            extractedText: '',
            editedText: '',
            status: 'pending',
        }));
        setDocuments(prev => [...prev, ...newDocs]);
    };

    const processDocument = async (doc: ExtractedDocument) => {
        setIsProcessing(true);
        setDocuments(prev => prev.map(d =>
            d.id === doc.id ? { ...d, status: 'processing' } : d
        ));

        // Simulate OCR processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Use random mock text
        const mockText = mockTexts[Math.floor(Math.random() * mockTexts.length)];

        setDocuments(prev => prev.map(d =>
            d.id === doc.id ? {
                ...d,
                status: 'done',
                extractedText: mockText,
                editedText: mockText
            } : d
        ));

        setSelectedDoc(prev => prev?.id === doc.id ? {
            ...prev,
            status: 'done',
            extractedText: mockText,
            editedText: mockText
        } : prev);

        setIsProcessing(false);
    };

    const processAll = async () => {
        const pending = documents.filter(d => d.status === 'pending');
        for (const doc of pending) {
            await processDocument(doc);
        }
    };

    const handleTextEdit = (text: string) => {
        if (!selectedDoc) return;
        setDocuments(prev => prev.map(d =>
            d.id === selectedDoc.id ? { ...d, editedText: text } : d
        ));
        setSelectedDoc(prev => prev ? { ...prev, editedText: text } : null);
    };

    const copyToClipboard = () => {
        if (!selectedDoc) return;
        navigator.clipboard.writeText(selectedDoc.editedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const downloadAsText = () => {
        if (!selectedDoc) return;
        const blob = new Blob([selectedDoc.editedText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${selectedDoc.name.replace(/\.[^/.]+$/, '')}_extracted.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const removeDocument = (id: string) => {
        const doc = documents.find(d => d.id === id);
        if (doc) URL.revokeObjectURL(doc.originalUrl);
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedDoc?.id === id) setSelectedDoc(null);
    };

    const clearAll = () => {
        documents.forEach(d => URL.revokeObjectURL(d.originalUrl));
        setDocuments([]);
        setSelectedDoc(null);
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col py-4 px-6">
            <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glow-border flex items-center justify-center">
                            <ScanText size={20} className="text-[var(--color-glow)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">OCR Document Editor</h1>
                            <p className="text-xs text-[var(--color-text-muted)]">Extract & edit text from images and PDFs</p>
                        </div>
                    </div>
                    {documents.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)]"
                            >
                                <Trash2 size={14} /> Clear All
                            </button>
                            {documents.some(d => d.status === 'pending') && (
                                <button
                                    onClick={processAll}
                                    disabled={isProcessing}
                                    className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-active-green)] text-black shadow-[0_0_15px_var(--color-active-green-glow)] disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <ScanText size={14} />}
                                    Extract All
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
                    {/* Left: Upload & Document List */}
                    <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
                        {/* Upload Area */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${isDragging
                                ? 'border-[var(--color-glow)] bg-[var(--color-glow)]/5'
                                : 'border-[var(--color-dark-400)] hover:border-[var(--color-dark-300)] bg-[var(--color-dark-700)]/50'
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            <Upload size={24} className="mb-2 text-[var(--color-text-muted)]" />
                            <p className="text-xs text-white font-medium">Drop images or PDFs</p>
                            <p className="text-xs text-[var(--color-text-muted)]">or click to browse</p>
                        </div>

                        {/* Document List */}
                        {documents.length > 0 && (
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {documents.map(doc => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 ${selectedDoc?.id === doc.id
                                            ? 'bg-[var(--color-glow)]/20 border border-[var(--color-glow)]'
                                            : 'bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] hover:border-[var(--color-dark-400)]'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded bg-[var(--color-dark-600)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {doc.originalUrl.includes('pdf') ? (
                                                <FileText size={18} className="text-red-400" />
                                            ) : (
                                                <img src={doc.originalUrl} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-white truncate">{doc.name}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {doc.status === 'pending' && <span className="text-[10px] text-[var(--color-using-amber)]">Ready to extract</span>}
                                                {doc.status === 'processing' && (
                                                    <><Loader2 size={10} className="animate-spin text-[var(--color-using-amber)]" /><span className="text-[10px] text-[var(--color-using-amber)]">Processing...</span></>
                                                )}
                                                {doc.status === 'done' && (
                                                    <><Check size={10} className="text-[var(--color-active-green)]" /><span className="text-[10px] text-[var(--color-active-green)]">Extracted</span></>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeDocument(doc.id); }}
                                            className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-inactive-red)] hover:bg-[var(--color-dark-500)]"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Text Editor */}
                    <div className="lg:col-span-2 flex flex-col min-h-0">
                        {selectedDoc ? (
                            <div className="flex-1 flex flex-col min-h-0">
                                {/* Editor Toolbar */}
                                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <Edit3 size={14} className="text-[var(--color-glow)]" />
                                        <span className="text-xs text-white font-medium">{selectedDoc.name}</span>
                                    </div>
                                    {selectedDoc.status === 'done' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={copyToClipboard}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-dark-500)]"
                                            >
                                                {copied ? <Check size={12} className="text-[var(--color-active-green)]" /> : <Copy size={12} />}
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                            <button
                                                onClick={downloadAsText}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-[var(--color-dark-500)] text-white hover:bg-[var(--color-dark-400)]"
                                            >
                                                <Download size={12} /> Download .txt
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Text Area */}
                                <div className="flex-1 min-h-0">
                                    {selectedDoc.status === 'done' ? (
                                        <textarea
                                            value={selectedDoc.editedText}
                                            onChange={(e) => handleTextEdit(e.target.value)}
                                            className="w-full h-full p-4 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] text-white text-sm font-mono resize-none focus:outline-none focus:border-[var(--color-glow)]"
                                            placeholder="Extracted text will appear here..."
                                        />
                                    ) : selectedDoc.status === 'processing' ? (
                                        <div className="w-full h-full rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] flex flex-col items-center justify-center">
                                            <Loader2 size={32} className="animate-spin text-[var(--color-glow)] mb-3" />
                                            <p className="text-sm text-white">Extracting text...</p>
                                            <p className="text-xs text-[var(--color-text-muted)] mt-1">This may take a moment</p>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] flex flex-col items-center justify-center">
                                            <ScanText size={32} className="text-[var(--color-text-muted)] mb-3" />
                                            <p className="text-sm text-white">Ready to extract</p>
                                            <button
                                                onClick={() => processDocument(selectedDoc)}
                                                className="mt-3 px-4 py-2 rounded-lg text-xs font-medium glow-button text-white"
                                            >
                                                Extract Text
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 rounded-xl bg-[var(--color-dark-700)] border border-[var(--color-dark-500)] flex flex-col items-center justify-center">
                                <ImageIcon size={48} className="text-[var(--color-text-muted)] mb-3 opacity-30" />
                                <p className="text-sm text-[var(--color-text-muted)]">Upload a document to get started</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Supports images and PDFs</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
