import { create } from 'zustand';

export interface PDFFile {
  id: string;
  name: string;
  uri?: string;
  size: number;
  extractedText: string;
  createdAt: Date;
  filename?: string;
  originalName?: string;
  mimeType?: string;
  isFromBackend?: boolean;
}

interface SimpleAppState {
  // PDF Files
  pdfFiles: PDFFile[];
  currentPDF: PDFFile | null;
  
  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Hydration state
  hasHydrated: boolean;
  
  // Actions
  addPDFFile: (file: PDFFile) => void;
  updatePDFText: (id: string, text: string) => void;
  removePDFFile: (id: string) => void;
  setCurrentPDF: (file: PDFFile | null) => void;
  setLoading: (loading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hasHydrated: boolean) => void;
  clearAll: () => void;
}

// Create a simple store without persistence to avoid hydration issues
export const useSimpleAppStore = create<SimpleAppState>((set, get) => ({
  // Initial state
  pdfFiles: [],
  currentPDF: null,
  isLoading: false,
  isUploading: false,
  error: null,
  hasHydrated: true, // Always hydrated since no persistence

  // Actions
  addPDFFile: (file) => {
    set((state) => ({
      pdfFiles: [...state.pdfFiles, file],
    }));
  },

  updatePDFText: (id, text) => {
    set((state) => ({
      pdfFiles: state.pdfFiles.map((pdf) =>
        pdf.id === id ? { ...pdf, extractedText: text } : pdf
      ),
    }));
  },

  removePDFFile: (id) => {
    set((state) => ({
      pdfFiles: state.pdfFiles.filter((pdf) => pdf.id !== id),
      currentPDF: state.currentPDF?.id === id ? null : state.currentPDF,
    }));
  },

  setCurrentPDF: (file) => {
    set({ currentPDF: file });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setUploading: (uploading) => {
    set({ isUploading: uploading });
  },

  setError: (error) => {
    set({ error });
  },

  setHydrated: (hasHydrated) => {
    set({ hasHydrated });
  },

  clearAll: () => {
    set({
      pdfFiles: [],
      currentPDF: null,
      error: null,
    });
  },
}));
