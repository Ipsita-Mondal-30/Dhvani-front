// lib/currency-api.ts - Frontend API client
export interface CurrencyDetectionResult {
    denomination: number;
    confidence?: number;
    detectedText?: string;
    isIndianCurrency: boolean;
  }
  
  export interface CurrencyDetectionLog {
    id: string;
    userId?: string;
    denomination: number;
    confidence?: number;
    detectedText?: string;
    imageUri?: string;
    latitude?: number;
    longitude?: number;
    timestamp: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface CurrencyStats {
    denomination: number;
    count: number;
  }
  
  export interface CurrencyHistoryResponse {
    detections: CurrencyDetectionLog[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    stats: CurrencyStats[];
  }
  
  class CurrencyAPI {
    private baseUrl: string;
  
    constructor() {
      // Set your backend URL here - use localhost for development
      this.baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
    }
  
    /**
     * Process image with Google Vision API (via your backend)
     */
    async detectCurrency(base64Image: string): Promise<CurrencyDetectionResult> {
      const response = await fetch(`${this.baseUrl}/api/currency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process currency image');
      }
  
      const result = await response.json();
      return result.data;
    }
  
    /**
     * Log currency detection to backend
     */
    async logDetection(data: {
      userId?: string;
      denomination: number;
      confidence?: number;
      detectedText?: string;
      imageUri?: string;
      latitude?: number;
      longitude?: number;
    }): Promise<CurrencyDetectionLog> {
      const response = await fetch(`${this.baseUrl}/api/currency-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to log currency detection');
      }
  
      const result = await response.json();
      return result.data;
    }
  
    /**
     * Get currency detection history
     */
    async getDetectionHistory(params?: {
      userId?: string;
      limit?: number;
      offset?: number;
    }): Promise<CurrencyHistoryResponse> {
      const searchParams = new URLSearchParams();
      
      if (params?.userId) searchParams.append('userId', params.userId);
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset) searchParams.append('offset', params.offset.toString());
  
      const response = await fetch(
        `${this.baseUrl}/api/currency-detection?${searchParams.toString()}`
      );
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch detection history');
      }
  
      const result = await response.json();
      return result.data;
    }
  
    /**
     * Delete a currency detection record
     */
    async deleteDetection(id: string, userId?: string): Promise<void> {
      const searchParams = new URLSearchParams({ id });
      if (userId) searchParams.append('userId', userId);
  
      const response = await fetch(
        `${this.baseUrl}/api/currency-detection?${searchParams.toString()}`,
        {
          method: 'DELETE',
        }
      );
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete detection record');
      }
    }
  }
  
  // Export singleton instance
  export const currencyAPI = new CurrencyAPI();
  
  // Export class for custom instances
  export default CurrencyAPI;