import * as DocumentPicker from 'expo-document-picker';

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
    console.log('📝 [PDFService] Extracting text from PDF:', uri);
    
    // TODO: Implement actual PDF text extraction
    // For now, return placeholder text
    const placeholderText = `This is placeholder text extracted from the PDF file.

You can replace this service method with actual PDF text extraction using libraries like:
- react-native-pdf-lib
- react-native-pdf-to-text
- or server-side extraction

The PDF file is located at: ${uri}

This text would normally contain the actual content from your PDF document.`;

    console.log('✅ [PDFService] Text extraction completed. Length:', placeholderText.length);
    return placeholderText;
  }

  static async validatePDFFile(uri: string): Promise<boolean> {
    console.log('🔍 [PDFService] Validating PDF file:', uri);
    
    // Basic validation - check if URI exists
    if (!uri || uri.trim() === '') {
      console.log('❌ [PDFService] Invalid URI');
      return false;
    }

    console.log('✅ [PDFService] PDF file validation passed');
    return true;
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