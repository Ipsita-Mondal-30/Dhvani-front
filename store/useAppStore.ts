import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackendService } from '@/services/backendService';

export interface PDFFile {
  id: string;
  name: string;
  uri?: string; // Optional for backend documents
  size: number;
  extractedText: string;
  createdAt: Date;
  // Backend fields
  filename?: string;
  originalName?: string;
  mimeType?: string;
  isFromBackend?: boolean;
}

interface AppState {
  // PDF Files
  pdfFiles: PDFFile[];
  currentPDF: PDFFile | null;
  
  // Loading states
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  
  // Actions
  addPDFFile: (file: PDFFile) => void;
  updatePDFText: (id: string, text: string) => void;
  removePDFFile: (id: string) => void;
  setCurrentPDF: (file: PDFFile | null) => void;
  setLoading: (loading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  clearAll: () => void;
  
  // Backend actions
  uploadPDFToBackend: (fileUri: string, fileName: string, fileSize: number) => Promise<PDFFile>;
  loadDocumentsFromBackend: () => Promise<void>;
  deleteDocumentFromBackend: (id: string) => Promise<void>;
}

// Helper function to convert backend document to PDFFile
const backendToPDFFile = (doc: any): PDFFile => ({
  id: doc.id,
  name: doc.filename || doc.originalName,
  size: doc.fileSize,
  extractedText: doc.extractedText,
  createdAt: new Date(doc.createdAt),
  filename: doc.filename,
  originalName: doc.originalName,
  mimeType: doc.mimeType,
  isFromBackend: true,
});

// Helper function to convert Date strings back to Date objects
const reviveDates = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(reviveDates);
  }
  
  const result = { ...obj };
  Object.keys(result).forEach(key => {
    if (key === 'createdAt' && typeof result[key] === 'string') {
      result[key] = new Date(result[key]);
    } else if (typeof result[key] === 'object') {
      result[key] = reviveDates(result[key]);
    }
  });
  
  return result;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      pdfFiles: [],
      currentPDF: null,
      isLoading: false,
      isUploading: false,
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

      setUploading: (uploading) => {
        set({ isUploading: uploading });
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
          isUploading: false,
          error: null,
        });
      },

      // Backend actions
      uploadPDFToBackend: async (fileUri, fileName, fileSize) => {
        try {
          set({ isUploading: true, error: null });
          console.log('🚀 [Store] Uploading PDF to backend:', fileName);
          
          const backendDoc = await BackendService.uploadPDF(fileUri, fileName, fileSize);
          const pdfFile = backendToPDFFile(backendDoc);
          
          // Add to store
          get().addPDFFile(pdfFile);
          
          console.log('✅ [Store] PDF uploaded and added to store');
          return pdfFile;
        } catch (error) {
          console.error('💥 [Store] Upload error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Upload failed';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isUploading: false });
        }
      },

      loadDocumentsFromBackend: async () => {
        try {
          set({ isLoading: true, error: null });
          console.log('📋 [Store] Loading documents from backend...');
          
          const backendDocs = await BackendService.getAllDocuments();
          const pdfFiles = backendDocs.map(backendToPDFFile);
          
          set({ pdfFiles });
          console.log('✅ [Store] Loaded', pdfFiles.length, 'documents from backend');
        } catch (error) {
          console.error('💥 [Store] Load documents error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
          set({ error: errorMessage });
        } finally {
          set({ isLoading: false });
        }
      },

      deleteDocumentFromBackend: async (id) => {
        try {
          set({ isLoading: true, error: null });
          console.log('🗑️ [Store] Deleting document from backend:', id);
          
          await BackendService.deleteDocument(id);
          get().removePDFFile(id);
          
          console.log('✅ [Store] Document deleted from backend and store');
        } catch (error) {
          console.error('💥 [Store] Delete error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete document';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'dhvani-storage',
      storage: {
        getItem: async (name) => {
          console.log('📖 [Store] Loading data from AsyncStorage:', name);
          const value = await AsyncStorage.getItem(name);
          if (value) {
            const parsed = JSON.parse(value);
            const revivedData = reviveDates(parsed);
            console.log('📖 [Store] Data loaded and dates revived');
            return revivedData;
          }
          return null;
        },
        setItem: async (name, value) => {
          console.log('💾 [Store] Saving data to AsyncStorage:', name);
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          console.log('🗑️ [Store] Removing data from AsyncStorage:', name);
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