import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import { Alert } from 'react-native';
import { BackendService } from './backendService';

export interface SOSLog {
  id: string;
  userId?: string;
  latitude: number;
  longitude: number;
  status: string;
  message?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export class SOSService {
  // Emergency contacts - in a real app, these would be stored in user preferences
  private static emergencyContacts: string[] = [
    // Add your emergency contact numbers here
    // '+1234567890', // Example format
  ];

  // Send SOS with location
  static async sendSOS(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🚨 [SOS] Starting SOS process...');

      // Step 1: Request location permission
      console.log('📍 [SOS] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('❌ [SOS] Location permission denied');
        const logResult = await this.logSOSEvent(0, 0, 'Permission Denied', '');
        return { 
          success: false, 
          message: 'Location permission is required for SOS functionality.' 
        };
      }

      // Step 2: Get current location
      console.log('🌍 [SOS] Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log('📍 [SOS] Location obtained:', { latitude, longitude });

      // Step 3: Create emergency message
      const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const emergencyMessage = `🚨 EMERGENCY ALERT from Dhvani App!\n\nI need immediate help!\n\nMy current location:\n${googleMapsLink}\n\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nThis is an automated emergency message.`;

      console.log('💬 [SOS] Emergency message created');

      // Step 4: Check SMS availability and send
      let smsStatus = 'Failed';
      let smsMessage = '';

      const isAvailable = await SMS.isAvailableAsync();
      
      if (!isAvailable) {
        console.error('❌ [SOS] SMS not available on this device');
        smsStatus = 'SMS Not Available';
        smsMessage = 'SMS functionality is not available on this device.';
      } else if (this.emergencyContacts.length === 0) {
        console.error('❌ [SOS] No emergency contacts configured');
        smsStatus = 'No Contacts';
        smsMessage = 'No emergency contacts have been configured. Please add emergency contacts in settings.';
      } else {
        try {
          console.log('📱 [SOS] Sending SMS to emergency contacts...');
          const { result } = await SMS.sendSMSAsync(
            this.emergencyContacts,
            emergencyMessage
          );
          
          if (result === 'sent') {
            smsStatus = 'SMS Sent';
            smsMessage = `Emergency SMS sent to ${this.emergencyContacts.length} contact(s).`;
            console.log('✅ [SOS] SMS sent successfully');
          } else if (result === 'cancelled') {
            smsStatus = 'SMS Cancelled';
            smsMessage = 'SMS sending was cancelled by user.';
            console.log('⚠️ [SOS] SMS sending cancelled');
          } else {
            smsStatus = 'SMS Failed';
            smsMessage = 'Failed to send emergency SMS.';
            console.error('❌ [SOS] SMS sending failed');
          }
        } catch (smsError) {
          console.error('❌ [SOS] SMS error:', smsError);
          smsStatus = 'SMS Error';
          smsMessage = 'An error occurred while sending emergency SMS.';
        }
      }

      // Step 5: Log the SOS event to backend
      console.log('💾 [SOS] Logging SOS event to backend...');
      const logResult = await this.logSOSEvent(latitude, longitude, smsStatus, emergencyMessage);

      if (!logResult.success) {
        console.warn('⚠️ [SOS] Failed to log SOS event:', logResult.error);
      }

      // Step 6: Return result
      const success = smsStatus === 'SMS Sent';
      return {
        success,
        message: smsMessage || (success ? 'SOS sent successfully!' : 'SOS failed to send.')
      };

    } catch (error) {
      console.error('💥 [SOS] SOS process failed:', error);
      
      // Log the error
      await this.logSOSEvent(0, 0, 'Error', `SOS Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        success: false,
        message: 'An unexpected error occurred while sending SOS. Please try again or contact emergency services directly.'
      };
    }
  }

  // Log SOS event to backend
  private static async logSOSEvent(
    latitude: number,
    longitude: number,
    status: string,
    message: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${BackendService.getBaseUrl()}/api/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          status,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [SOS] Event logged successfully:', data);
      
      return { success: true };
    } catch (error) {
      console.error('❌ [SOS] Failed to log event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get SOS history from backend
  static async getSOSHistory(): Promise<{ success: boolean; logs?: SOSLog[]; error?: string }> {
    try {
      console.log('📋 [SOS] Fetching SOS history...');
      
      const response = await fetch(`${BackendService.getBaseUrl()}/api/sos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [SOS] History fetched successfully:', data.logs?.length || 0, 'entries');
      
      return { success: true, logs: data.logs || [] };
    } catch (error) {
      console.error('❌ [SOS] Failed to fetch history:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Set emergency contacts (for future use)
  static setEmergencyContacts(contacts: string[]) {
    this.emergencyContacts = contacts;
    console.log('📞 [SOS] Emergency contacts updated:', contacts.length, 'contacts');
  }

  // Get current emergency contacts
  static getEmergencyContacts(): string[] {
    return [...this.emergencyContacts];
  }
}
