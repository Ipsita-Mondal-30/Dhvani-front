// lib/currency-service.ts
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
  
  class CurrencyService {
    private baseUrl: string;
  
    constructor(baseUrl?: string) {
      this.baseUrl = baseUrl || (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : 'https://your-app-domain.com'
      );
    }
  
    /**
     * Process image with Google Vision API
     */
    async detectCurrency(base64Image: string): Promise<CurrencyDetectionResult> {
      const apiKey = process.env.EXPO_PUBLIC_GCP_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Cloud Vision API key not found');
      }
  
      const requestBody = {
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 20 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 10 }
            ],
          },
        ],
      };
  
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody),
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vision API request failed: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
  
      if (result.error) {
        throw new Error(result.error.message || 'Vision API error');
      }
  
      const responses = result.responses;
      if (!responses || responses.length === 0) {
        throw new Error('No responses from Vision API');
      }
  
      return this.parseVisionResponse(responses[0]);
    }
  
    /**
     * Parse Google Vision API response to extract currency information
     */
    private parseVisionResponse(response: any): CurrencyDetectionResult {
      const textAnnotations = response?.textAnnotations;
      const fullTextAnnotation = response?.fullTextAnnotation;
      
      if (!textAnnotations?.length && !fullTextAnnotation?.text) {
        throw new Error('No text detected in the image');
      }
  
      // Collect all text
      let allText = '';
      
      if (textAnnotations && textAnnotations.length > 0) {
        allText += textAnnotations[0].description || '';
      }
      
      if (fullTextAnnotation?.text) {
        allText += ' ' + fullTextAnnotation.text;
      }
  
      // Additional text from all annotations
      if (textAnnotations) {
        textAnnotations.forEach((annotation: { description?: string }, index: number) => {
          if (index > 0) { // Skip first one as it's already included
            allText += ' ' + (annotation.description || '');
          }
        });
      }
  
      const fullText = allText.toLowerCase();
      
      // Check if it's Indian currency
      const indianCurrencyIndicators = [
        'rupee', 'india', 'reserve bank', 'rbi', 'inr', 'भारत', 'गवर्नर', 'गारंटी'
      ];
      
      const isIndianCurrency = indianCurrencyIndicators.some(indicator => 
        fullText.includes(indicator.toLowerCase())
      );
  
      // Detect denomination
      const denomination = this.extractDenomination(fullText);
  
      if (!denomination) {
        throw new Error('Could not determine denomination from detected text');
      }
  
      return {
        denomination,
        detectedText: allText.substring(0, 500), // Limit text length
        isIndianCurrency,
        confidence: this.calculateConfidence(fullText, denomination)
      };
    }
  
    /**
     * Extract denomination from detected text
     */
    private extractDenomination(text: string): number | null {
      const denominations = [2000, 500, 200, 100, 50, 20, 10]; // Check larger denominations first
      
      // Method 1: Direct number matching with context
      for (const denom of denominations) {
        const patterns = [
          new RegExp(`\\b${denom}\\b`, 'i'),
          new RegExp(`${denom}\\s*rupee`, 'i'),
          new RegExp(`rs\\s*${denom}`, 'i'),
          new RegExp(`₹\\s*${denom}`, 'i'),
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(text)) {
            return denom;
          }
        }
      }
  
      // Method 2: Written number matching
      const writtenNumbers: Record<string, number> = {
        'ten': 10,
        'twenty': 20,
        'fifty': 50,
        'one hundred': 100,
        'hundred': 100,
        'two hundred': 200,
        'five hundred': 500,
        'two thousand': 2000,
        'thousand': 2000 // Sometimes "two" might be missed
      };
  
      for (const [written, value] of Object.entries(writtenNumbers)) {
        if (text.includes(written)) {
          return value;
        }
      }
  
      // Method 3: Any number that matches valid denominations
      const numberMatches = text.match(/\b(\d+)\b/g);
      if (numberMatches) {
        for (const numberStr of numberMatches) {
          const number = parseInt(numberStr, 10);
          if (denominations.includes(number)) {
            return number;
          }
        }
      }
  
      return null;
    }
  
    /**
     * Calculate confidence score based on various factors
     */
    private calculateConfidence(text: string, denomination: number): number {
      let confidence = 0.5; // Base confidence
  
      // Higher confidence if multiple indicators are present
      const denominationStr = denomination.toString();
      if (text.includes(denominationStr)) confidence += 0.2;
      if (text.includes('rupee')) confidence += 0.1;
      if (text.includes('reserve bank')) confidence += 0.1;
      if (text.includes('india')) confidence += 0.1;
  
      return Math.min(confidence, 1.0);
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
  export const currencyService = new CurrencyService();
  
  // Export class for custom instances
  export default CurrencyService;