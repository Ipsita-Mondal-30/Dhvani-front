interface PDFDocument {
  id: string;
  filename: string;
  originalName: string;
  fileSize: number;
  extractedText: string;
  createdAt: string;
}

interface UploadResponse {
  success: boolean;
  document?: PDFDocument;
  error?: string;
}

interface DocumentsResponse {
  success: boolean;
  documents?: PDFDocument[];
  error?: string;
}

export class BackendService {
  // Default URL - using network IP for physical device testing
  private static BASE_URL = 'https://dhvani-back.vercel.app/';
  
  // Alternative URLs for different environments:
  // Production: 'https://dhvani-backend.vercel.app'
  // iOS Simulator: 'http://localhost:3000'
  // Android Emulator: 'http://10.0.2.2:3000'  
  // Physical Device: 'http://YOUR_COMPUTER_IP:3000' (e.g., 'http://192.168.1.100:3000')
  
  // Method to change backend URL at runtime
  static setBackendUrl(url: string): void {
    console.log('🔧 [BackendService] Changing backend URL from', this.BASE_URL, 'to', url);
    this.BASE_URL = url;
  }
  
  // Predefined URLs for easy switching
  static readonly URLS = {
    PRODUCTION: 'https://dhvani-backend.vercel.app',
    IOS_SIMULATOR: 'http://localhost:3000',
    ANDROID_EMULATOR: 'http://10.0.2.2:3000',
    // Add your computer's IP address here for physical device testing
    // PHYSICAL_DEVICE: 'http://192.168.1.100:3000',
  };
  
  // Method to set URL based on platform
  static setUrlForPlatform(platform: 'production' | 'ios' | 'android' | 'physical'): void {
    switch (platform) {
      case 'production':
        this.setBackendUrl(this.URLS.PRODUCTION);
        break;
      case 'ios':
        this.setBackendUrl(this.URLS.IOS_SIMULATOR);
        break;
      case 'android':
        this.setBackendUrl(this.URLS.ANDROID_EMULATOR);
        break;
      case 'physical':
        console.warn('⚠️ [BackendService] Physical device URL not configured. Please set your computer\'s IP address in URLS.PHYSICAL_DEVICE');
        break;
      default:
        console.warn('⚠️ [BackendService] Unknown platform:', platform);
    }
  }
  
  static async uploadPDF(fileUri: string, fileName: string, fileSize: number): Promise<PDFDocument> {
    const uploadUrl = `${this.BASE_URL}/api/pdf/upload`;
    
    try {
      console.log('🚀 [BackendService] Starting PDF upload...');
      console.log('📋 [BackendService] Upload details:');
      console.log('  - URL:', uploadUrl);
      console.log('  - File URI:', fileUri);
      console.log('  - File Name:', fileName);
      console.log('  - File Size:', fileSize);
      
      // Test if server is reachable first
      console.log('🔍 [BackendService] Testing server connectivity...');
      try {
        const testResponse = await fetch(`${this.BASE_URL}/api/health`, {
          method: 'GET',
        });
        console.log('✅ [BackendService] Server is reachable, status:', testResponse.status);
        
        if (testResponse.ok) {
          const healthData = await testResponse.json();
          console.log('🏥 [BackendService] Health check:', healthData.message);
        }
      } catch (testError) {
        console.error('❌ [BackendService] Server connectivity test failed:', testError);
        throw new Error(`Cannot reach server at ${this.BASE_URL}. Please check if the backend is running and the URL is correct.`);
      }

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        type: 'application/pdf',
        name: fileName,
      } as any);

      console.log('📤 [BackendService] Sending upload request...');
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('📥 [BackendService] Upload response received:');
      console.log('  - Status:', response.status);
      console.log('  - Status Text:', response.statusText);
      console.log('  - Headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      let responseText;
      try {
        responseText = await response.text();
        console.log('📄 [BackendService] Raw response text:', responseText);
      } catch (textError) {
        console.error('❌ [BackendService] Failed to read response text:', textError);
        throw new Error('Failed to read server response');
      }

      let data: UploadResponse;
      try {
        data = JSON.parse(responseText);
        console.log('📊 [BackendService] Parsed response data:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('❌ [BackendService] Failed to parse JSON response:', parseError);
        throw new Error(`Invalid JSON response from server: ${responseText}`);
      }

      if (!response.ok) {
        console.error('❌ [BackendService] HTTP error response:', response.status, data.error);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        console.error('❌ [BackendService] Server returned error:', data.error);
        throw new Error(data.error || 'Upload failed');
      }

      if (!data.document) {
        console.error('❌ [BackendService] No document in response');
        throw new Error('No document returned from server');
      }

      console.log('✅ [BackendService] PDF uploaded successfully!');
      console.log('📝 [BackendService] Document details:');
      console.log('  - ID:', data.document.id);
      console.log('  - Filename:', data.document.filename);
      console.log('  - Text length:', data.document.extractedText.length);
      console.log('  - Created:', data.document.createdAt);

      return data.document;
    } catch (error) {
      console.error('💥 [BackendService] Upload error details:');
      console.error('  - Error type:', (error as any)?.constructor?.name);
      console.error('  - Error message:', (error as any)?.message);
      console.error('  - Full error:', error);
      
      if ((error as any)?.message && typeof (error as any).message === 'string' && (error as any).message.includes('Network request failed')) {
        throw new Error(`Network connection failed. Please check:\n1. Backend server is running at ${this.BASE_URL}\n2. Your device can reach the server\n3. Firewall/network settings allow the connection`);
      }
      
      throw error;
    }
  }

  static async getAllDocuments(): Promise<PDFDocument[]> {
    const fetchUrl = `${this.BASE_URL}/api/pdf`;
    
    try {
      console.log('📋 [BackendService] Fetching all documents from:', fetchUrl);
      
      const response = await fetch(fetchUrl);
      console.log('📥 [BackendService] Fetch response status:', response.status);
      
      const responseText = await response.text();
      console.log('📄 [BackendService] Raw fetch response:', responseText);
      
      const data: DocumentsResponse = JSON.parse(responseText);
      console.log('📊 [BackendService] Parsed fetch data:', JSON.stringify(data, null, 2));

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch documents');
      }

      console.log('✅ [BackendService] Fetched', data.documents?.length || 0, 'documents');
      return data.documents || [];
    } catch (error) {
      console.error('💥 [BackendService] Fetch error:', error);
      throw error;
    }
  }

  static async getDocument(id: string): Promise<PDFDocument> {
    const fetchUrl = `${this.BASE_URL}/api/pdf/${id}`;
    
    try {
      console.log('📄 [BackendService] Fetching document:', id, 'from:', fetchUrl);
      
      const response = await fetch(fetchUrl);
      const data: { success: boolean; document?: PDFDocument; error?: string } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch document');
      }

      if (!data.document) {
        throw new Error('Document not found');
      }

      console.log('✅ [BackendService] Document fetched successfully');
      return data.document;
    } catch (error) {
      console.error('💥 [BackendService] Fetch document error:', error);
      throw error;
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    const deleteUrl = `${this.BASE_URL}/api/pdf/${id}`;
    
    try {
      console.log('🗑️ [BackendService] Deleting document:', id, 'at:', deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete document');
      }

      console.log('✅ [BackendService] Document deleted successfully');
    } catch (error) {
      console.error('💥 [BackendService] Delete error:', error);
      throw error;
    }
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to get the current base URL being used
  static getBaseUrl(): string {
    return this.BASE_URL;
  }

  // Health check method
  static async checkHealth(): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      console.log('🏥 [BackendService] Performing health check...');
      
      const response = await fetch(`${this.BASE_URL}/api/health`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      console.log('✅ [BackendService] Health check passed:', data.message);
      return data;
    } catch (error) {
      console.error('💥 [BackendService] Health check failed:', error);
      throw error;
    }
  }
} 