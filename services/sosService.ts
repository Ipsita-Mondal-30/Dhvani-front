import * as Location from 'expo-location';
import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';
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

export interface EmergencyNumbers {
  police: string;
  fire: string;
  medical: string;
  general: string;
}

export class SOSService {
  // Emergency contacts - in a real app, these would be stored in user preferences
  private static emergencyContacts: string[] = [
    // Add your emergency contact numbers here
    // '+1234567890', // Example format
  ];

  // Regional emergency numbers
  private static emergencyNumbers: { [key: string]: EmergencyNumbers } = {
    'US': { police: '911', fire: '911', medical: '911', general: '911' },
    'CA': { police: '911', fire: '911', medical: '911', general: '911' },
    'GB': { police: '999', fire: '999', medical: '999', general: '999' },
    'EU': { police: '112', fire: '112', medical: '112', general: '112' },
    'IN': { police: '100', fire: '101', medical: '108', general: '112' },
    'AU': { police: '000', fire: '000', medical: '000', general: '000' },
    'JP': { police: '110', fire: '119', medical: '119', general: '110' },
    'KR': { police: '112', fire: '119', medical: '119', general: '112' },
    'CN': { police: '110', fire: '119', medical: '120', general: '110' },
    'BR': { police: '190', fire: '193', medical: '192', general: '190' },
    'MX': { police: '911', fire: '911', medical: '911', general: '911' },
    'RU': { police: '102', fire: '101', medical: '103', general: '112' },
    'ZA': { police: '10111', fire: '10177', medical: '10177', general: '112' },
    'DEFAULT': { police: '112', fire: '112', medical: '112', general: '112' }
  };

  // Get emergency number based on location
  private static async getEmergencyNumber(type: 'police' | 'fire' | 'medical' | 'general' = 'general'): Promise<string> {
    try {
      // Try to get location for better emergency number detection
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Low,
        });
        
        // Use reverse geocoding to determine country
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (reverseGeocode.length > 0) {
          const countryCode = reverseGeocode[0].isoCountryCode?.toUpperCase() || 'DEFAULT';
          const emergencyNumbers = this.emergencyNumbers[countryCode] || this.emergencyNumbers['DEFAULT'];
          return emergencyNumbers[type];
        }
      }
    } catch (error) {
      console.warn('⚠️ [SOSService] Could not determine location for emergency number:', error);
    }
    
    // Fallback based on platform and region
    if (Platform.OS === 'ios') {
      return '911'; // Default for iOS (US/Canada)
    } else {
      return '112'; // Default for Android (International)
    }
  }

  // Send SOS with location
  static async sendSOS(): Promise<{ success: boolean; message: string; emergencyMessage?: string }> {
    try {
      console.log('🚨 [SOS] Starting SOS process...');

      // Step 1: Request location permission
      console.log('📍 [SOS] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('❌ [SOS] Location permission denied');
        const logResult = await this.logSOSEvent(0, 0, 'Permission Denied', '');
        
        // Still try to call emergency services without location
        const callResult = await this.callEmergencyServices();
        return {
          success: callResult.success,
          message: `Location permission denied. ${callResult.message}`
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
      const emergencyMessage = `🚨 EMERGENCY ALERT from Dhvani App!\n\nI need immediate help!\n\nMy current location:\n${googleMapsLink}\n\nCoordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nTime: ${new Date().toLocaleString()}\n\nThis is an automated emergency message.`;

      console.log('💬 [SOS] Emergency message created');

      // Step 4: Check SMS availability and send
      let smsStatus = 'Failed';
      let smsMessage = '';
      let shouldCallEmergency = false;

      const isAvailable = await SMS.isAvailableAsync();
      
      if (!isAvailable) {
        console.error('❌ [SOS] SMS not available on this device');
        smsStatus = 'SMS Not Available';
        smsMessage = 'SMS functionality is not available on this device.';
        shouldCallEmergency = true;
      } else if (this.emergencyContacts.length === 0) {
        console.error('❌ [SOS] No emergency contacts configured');
        smsStatus = 'No Contacts';
        smsMessage = 'No emergency contacts have been configured. Calling emergency services.';
        shouldCallEmergency = true;
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
            smsMessage = 'SMS sending was cancelled. Calling emergency services as backup.';
            shouldCallEmergency = true;
            console.log('⚠️ [SOS] SMS sending cancelled');
          } else {
            smsStatus = 'SMS Failed';
            smsMessage = 'Failed to send emergency SMS. Calling emergency services.';
            shouldCallEmergency = true;
            console.error('❌ [SOS] SMS sending failed');
          }
        } catch (smsError) {
          console.error('❌ [SOS] SMS error:', smsError);
          smsStatus = 'SMS Error';
          smsMessage = 'An error occurred while sending emergency SMS. Calling emergency services.';
          shouldCallEmergency = true;
        }
      }

      // Step 4.5: Call emergency services if SMS failed or no contacts
      if (shouldCallEmergency) {
        console.log('📞 [SOS] Attempting to call emergency services...');
        const callResult = await this.callEmergencyServices();
        if (callResult.success) {
          smsStatus = smsStatus + ' + Emergency Call';
          smsMessage = smsMessage + ' Emergency services called automatically.';
        } else {
          smsMessage = smsMessage + ' Failed to call emergency services automatically.';
        }
      }

      // Step 5: Log the SOS event to backend
      console.log('💾 [SOS] Logging SOS event to backend...');
      const logResult = await this.logSOSEvent(latitude, longitude, smsStatus, emergencyMessage);

      if (!logResult.success) {
        console.warn('⚠️ [SOS] Failed to log SOS event:', logResult.error);
      }

      // Step 6: Return result
      const success = smsStatus === 'SMS Sent' || smsStatus.includes('Emergency Call');
      return {
        success,
        message: smsMessage || (success ? 'SOS sent successfully!' : 'SOS failed to send.'),
        emergencyMessage: emergencyMessage
      };

    } catch (error) {
      console.error('💥 [SOS] SOS process failed:', error);
      
      // Log the error
      await this.logSOSEvent(0, 0, 'Error', `SOS Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Try to call emergency services as last resort
      const callResult = await this.callEmergencyServices();
      
      return {
        success: callResult.success,
        message: `An unexpected error occurred while sending SOS. ${callResult.message}`
      };
    }
  }

  // Call emergency services with regional number detection
  static async callEmergencyServices(type: 'police' | 'fire' | 'medical' | 'general' = 'general'): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📞 [SOS] Calling emergency services...');
      
      // Get appropriate emergency number for region
      const emergencyNumber = await this.getEmergencyNumber(type);
      const phoneUrl = `tel:${emergencyNumber}`;
      
      console.log(`📞 [SOS] Emergency number determined: ${emergencyNumber}`);
      
      // Check if the device can make phone calls
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        console.log(`📞 [SOS] Opening dialer for ${emergencyNumber}...`);
        await Linking.openURL(phoneUrl);
        return {
          success: true,
          message: `Emergency call initiated to ${emergencyNumber}.`
        };
      } else {
        console.error('❌ [SOS] Device cannot make phone calls');
        return {
          success: false,
          message: `Device cannot make phone calls. Please dial ${emergencyNumber} manually.`
        };
      }
    } catch (error) {
      console.error('💥 [SOS] Failed to call emergency services:', error);
      return {
        success: false,
        message: 'Failed to initiate emergency call. Please call emergency services manually.'
      };
    }
  }

  // Direct emergency call using Linking API
  static async callEmergencyNumber(phoneNumber?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('📞 [SOS] Making direct emergency call...');
      
      // Use provided number, emergency contact, or default emergency number
      let numberToCall = phoneNumber;
      
      if (!numberToCall) {
        // Try to use first emergency contact if available
        if (this.emergencyContacts.length > 0) {
          numberToCall = this.emergencyContacts[0];
          console.log(`📞 [SOS] Using emergency contact: ${numberToCall}`);
        } else {
          // Fall back to general emergency number
          numberToCall = await this.getEmergencyNumber('general');
          console.log(`📞 [SOS] Using general emergency number: ${numberToCall}`);
        }
      }
      
      const phoneUrl = `tel:${numberToCall}`;
      
      // Check if the device can make phone calls
      const canOpen = await Linking.canOpenURL(phoneUrl);
      
      if (canOpen) {
        console.log(`📞 [SOS] Opening dialer for ${numberToCall}...`);
        await Linking.openURL(phoneUrl);
        return {
          success: true,
          message: `Emergency call initiated to ${numberToCall}.`
        };
      } else {
        console.error('❌ [SOS] Device cannot make phone calls');
        return {
          success: false,
          message: `Device cannot make phone calls. Please dial ${numberToCall} manually.`
        };
      }
    } catch (error) {
      console.error('💥 [SOS] Failed to make direct emergency call:', error);
      return {
        success: false,
        message: 'Failed to initiate emergency call. Please call emergency services manually.'
      };
    }
  }

  // Quick emergency dial methods for specific services
  static async callPolice(): Promise<{ success: boolean; message: string }> {
    return this.callEmergencyServices('police');
  }

  static async callFire(): Promise<{ success: boolean; message: string }> {
    return this.callEmergencyServices('fire');
  }

  static async callMedical(): Promise<{ success: boolean; message: string }> {
    return this.callEmergencyServices('medical');
  }

  // Voice-activated SOS (for "help help help" detection)
  static async voiceActivatedSOS(): Promise<{ success: boolean; message: string }> {
    console.log('🎤 [SOS] Voice-activated SOS triggered');
    
    // Add slight delay to allow user to cancel if false positive
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await this.sendSOS();
        resolve(result);
      }, 2000); // 2 second delay
    });
  }

  // Panic mode - immediate emergency call without confirmation
  static async panicMode(): Promise<{ success: boolean; message: string }> {
    console.log('🚨 [SOS] PANIC MODE ACTIVATED - Immediate emergency call');
    
    try {
      // Immediately call emergency services without SMS
      const callResult = await this.callEmergencyServices();
      
      // Also try to send location via SMS if contacts exist
      if (this.emergencyContacts.length > 0) {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            
            const { latitude, longitude } = location.coords;
            const googleMapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
            const panicMessage = `🚨 PANIC ALERT from Dhvani App!\n\nEMERGENCY - I need immediate help!\n\nLocation: ${googleMapsLink}\n\nTime: ${new Date().toLocaleString()}\n\nThis is an automated panic alert.`;
            
            await SMS.sendSMSAsync(this.emergencyContacts, panicMessage);
            
            // Log the panic event
            await this.logSOSEvent(latitude, longitude, 'Panic Mode + Call', panicMessage);
          }
        } catch (smsError) {
          console.error('❌ [SOS] Failed to send panic SMS:', smsError);
        }
      }
      
      return {
        success: callResult.success,
        message: `PANIC MODE: ${callResult.message}`
      };
      
    } catch (error) {
      console.error('💥 [SOS] Panic mode failed:', error);
      return {
        success: false,
        message: 'Panic mode failed. Please call emergency services manually.'
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

  // Get emergency numbers for current region
  static async getRegionalEmergencyNumbers(): Promise<EmergencyNumbers> {
    try {
      const generalNumber = await this.getEmergencyNumber('general');
      const policeNumber = await this.getEmergencyNumber('police');
      const fireNumber = await this.getEmergencyNumber('fire');
      const medicalNumber = await this.getEmergencyNumber('medical');
      
      return {
        general: generalNumber,
        police: policeNumber,
        fire: fireNumber,
        medical: medicalNumber
      };
    } catch (error) {
      console.error('❌ [SOS] Failed to get regional emergency numbers:', error);
      return this.emergencyNumbers['DEFAULT'];
    }
  }
}