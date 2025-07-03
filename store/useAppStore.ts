import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PDFFile {
  id: string;
  name: string;
  uri: string;
  size: number;
  extractedText: string;
  createdAt: Date;
}

interface AppState {
  // PDF Files
  pdfFiles: PDFFile[];
  currentPDF: PDFFile | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addPDFFile: (file: PDFFile) => void;
  updatePDFText: (id: string, text: string) => void;
  removePDFFile: (id: string) => void;
  setCurrentPDF: (file: PDFFile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      pdfFiles: [],
      currentPDF: null,
      isLoading: false,
      error: null,

      // Actions
      addPDFFile: (file) => {
        console.log('📁 [Store] Adding PDF file:', file.name);
        set((state) => ({
          pdfFiles: [file, ...state.pdfFiles],
          currentPDF: file,
          error: null,
        }));
      },

      updatePDFText: (id, text) => {
        console.log('✏️ [Store] Updating PDF text for ID:', id);
        set((state) => ({
          pdfFiles: state.pdfFiles.map((file) =>
            file.id === id ? { ...file, extractedText: text } : file
          ),
          currentPDF: state.currentPDF?.id === id 
            ? { ...state.currentPDF, extractedText: text }
            : state.currentPDF,
        }));
      },

      removePDFFile: (id) => {
        console.log('🗑️ [Store] Removing PDF file with ID:', id);
        set((state) => ({
          pdfFiles: state.pdfFiles.filter((file) => file.id !== id),
          currentPDF: state.currentPDF?.id === id ? null : state.currentPDF,
        }));
      },

      setCurrentPDF: (file) => {
        console.log('📄 [Store] Setting current PDF:', file?.name || 'null');
        set({ currentPDF: file });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      clearAll: () => {
        console.log('🧹 [Store] Clearing all data');
        set({
          pdfFiles: [],
          currentPDF: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'dhvani-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
      // Only persist the PDF files, not loading states
      partialize: (state) => ({
        pdfFiles: state.pdfFiles,
        currentPDF: state.currentPDF,
      }),
    }
  )
); 