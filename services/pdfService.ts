import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as pdfjsLib from 'pdfjs-dist';

import { BackendService } from './backendService';

export interface PickedFile {
  name: string;
  uri: string;
  size: number;
  type: string;
}

export class PDFService {
  static async pickPDF(): Promise<PickedFile | null> {
    try {
      console.log('📁 [PDFService] Starting file picker...');
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        console.log('👤 [PDFService] User cancelled file selection');
        return null;
      }

      const asset = result.assets[0];
      console.log('✅ [PDFService] File picked successfully:', {
        name: asset.name,
        size: asset.size,
        type: asset.mimeType,
      });

      return {
        name: asset.name || 'Unknown File',
        uri: asset.uri,
        size: asset.size || 0,
        type: asset.mimeType || '',
      };
    } catch (error) {
      console.error('💥 [PDFService] File picker error:', error);
      throw new Error('Failed to pick file');
    }
  }

  static async extractTextFromPDF(uri: string): Promise<string> {
    console.log('📝 [PDFService] Starting PDF text extraction from:', uri);
    
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('PDF file not found');
      }

      console.log('🔍 [PDFService] File exists, size:', fileInfo.size);
      
      // Read PDF as base64
      console.log('📖 [PDFService] Reading PDF as base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('📊 [PDFService] Base64 length:', base64.length);
      
      // Convert base64 to binary array
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      console.log('🔄 [PDFService] Converted to binary, size:', bytes.length);
      
      // Load PDF document
      console.log('⚙️ [PDFService] Loading PDF document...');
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdf = await loadingTask.promise;
      
      console.log('📄 [PDFService] PDF loaded successfully, pages:', pdf.numPages);
      
      // Extract text from all pages
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`📄 [PDFService] Processing page ${pageNum}/${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n\n';
          console.log(`✅ [PDFService] Page ${pageNum} extracted ${pageText.length} characters`);
        } else {
          console.log(`⚠️ [PDFService] Page ${pageNum} contains no text`);
        }
      }
      
      console.log('🎯 [PDFService] Total text extracted:', fullText.length, 'characters');
      console.log('📄 [PDFService] Extracted text preview:');
      console.log('---START EXTRACTED TEXT---');
      console.log(fullText.substring(0, 500));
      console.log('---END EXTRACTED TEXT---');
      
      if (fullText.trim().length > 0) {
        return fullText.trim();
      } else {
        return 'No text could be extracted from this PDF. The PDF might contain only images or be password protected.';
      }

    } catch (error) {
      console.error('💥 [PDFService] Text extraction failed:', error);
      return `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  static async validatePDFFile(uri: string): Promise<boolean> {
    console.log('🔍 [PDFService] Validating PDF file:', uri);
    
    try {
      if (!uri || uri.trim() === '') {
        console.log('❌ [PDFService] Invalid URI');
        return false;
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        console.log('❌ [PDFService] File does not exist');
        return false;
      }

      if (fileInfo.size === 0) {
        console.log('❌ [PDFService] File is empty');
        return false;
      }

      console.log('✅ [PDFService] PDF file validation passed');
      return true;
    } catch (error) {
      console.error('❌ [PDFService] Validation error:', error);
      return false;
    }
  }

  static generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 