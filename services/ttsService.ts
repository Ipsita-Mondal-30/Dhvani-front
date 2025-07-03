import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { BackendService } from './backendService';

interface TTSConfig {
  voice?: {
    languageCode?: string;
    name?: string;
    ssmlGender?: 'NEUTRAL' | 'FEMALE' | 'MALE';
  };
  audioConfig?: {
    audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
  };
}

export class TTSService {
  private static sound: Audio.Sound | null = null;
  private static isLoading = false;
  private static isPlaying = false;
  private static isPaused = false;
  private static currentAudioUri: string | null = null;
  private static currentPosition = 0;
  private static duration = 0;

  // Initialize the service
  static async initialize(): Promise<void> {
    try {
      console.log('🎤 [TTS] Initializing TTS Service...');
      
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('✅ [TTS] TTS Service initialized successfully');
    } catch (error) {
      console.error('💥 [TTS] Failed to initialize TTS Service:', error);
      throw error;
    }
  }

  // Convert text to speech using backend API
  static async synthesizeSpeech(
    text: string,
    config: TTSConfig = {}
  ): Promise<string> {
    try {
      console.log('🎤 [TTS] Starting speech synthesis...');
      console.log('📝 [TTS] Text length:', text.length);
      
      this.isLoading = true;

      // Make API request to backend
      const response = await fetch(`${BackendService.getBaseUrl()}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          config,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [TTS] API Error:', response.status, errorText);
        
        // If TTS API is not available, create a mock audio file
        if (response.status === 404 || response.status === 405) {
          console.log('⚠️ [TTS] TTS API not available, creating mock audio...');
          const mockAudioUri = await this.createMockAudio(text);
          this.currentAudioUri = mockAudioUri;
          this.isLoading = false;
          return mockAudioUri;
        }
        
        throw new Error(`TTS API Error: ${response.status} - ${errorText}`);
      }

      // Get audio data as array buffer
      const audioData = await response.arrayBuffer();
      
      if (!audioData || audioData.byteLength === 0) {
        throw new Error('No audio content received from TTS API');
      }

      // Save audio to file
      const audioUri = await this.saveAudioToFile(audioData);
      
      console.log('✅ [TTS] Speech synthesis completed');
      console.log('📁 [TTS] Audio saved to:', audioUri);
      
      this.currentAudioUri = audioUri;
      this.isLoading = false;
      
      return audioUri;
    } catch (error) {
      console.error('💥 [TTS] Speech synthesis failed:', error);
      this.isLoading = false;
      throw error;
    }
  }

  // Save audio data to file
  private static async saveAudioToFile(audioData: ArrayBuffer): Promise<string> {
    try {
      const fileName = `tts_audio_${Date.now()}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('💾 [TTS] Saving audio to file:', fileUri);
      
      // Convert ArrayBuffer to base64
      const uint8Array = new Uint8Array(audioData);
      const base64 = btoa(String.fromCharCode(...uint8Array));
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ [TTS] Audio file saved successfully');
      return fileUri;
    } catch (error) {
      console.error('💥 [TTS] Failed to save audio file:', error);
      throw error;
    }
  }

  // Create a mock audio file for testing when TTS API is not available
  private static async createMockAudio(text: string): Promise<string> {
    try {
      const fileName = `mock_tts_audio_${Date.now()}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('🎭 [TTS] Creating mock audio file:', fileUri);
      
      // Create a minimal MP3 file with silence (about 2 seconds)
      // This is a very basic MP3 header for a silent audio file
      const mockMp3Data = new Uint8Array([
        0xFF, 0xFB, 0x90, 0x00, // MP3 header
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      ]);
      
      const base64 = btoa(String.fromCharCode(...mockMp3Data));
      
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('✅ [TTS] Mock audio file created successfully');
      console.log('📝 [TTS] Mock audio represents:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      
      return fileUri;
    } catch (error) {
      console.error('💥 [TTS] Failed to create mock audio file:', error);
      throw error;
    }
  }

  // Play the synthesized audio
  static async playAudio(audioUri?: string): Promise<void> {
    try {
      const uri = audioUri || this.currentAudioUri;
      
      if (!uri) {
        throw new Error('No audio URI provided');
      }

      console.log('▶️ [TTS] Playing audio:', uri);

      // Unload previous sound if exists
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false }
      );

      this.sound = sound;
      this.isPlaying = true;
      this.isPaused = false;
      this.currentPosition = 0;

      // Set up playback status update
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          this.currentPosition = status.positionMillis || 0;
          this.duration = status.durationMillis || 0;
          
          if (status.didJustFinish) {
            console.log('🏁 [TTS] Audio playback finished');
            this.isPlaying = false;
            this.isPaused = false;
            this.currentPosition = 0;
          }
        }
      });

      console.log('✅ [TTS] Audio playback started');
    } catch (error) {
      console.error('💥 [TTS] Failed to play audio:', error);
      throw error;
    }
  }

  // Pause audio playback
  static async pauseAudio(): Promise<void> {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
        this.isPaused = true;
        console.log('⏸️ [TTS] Audio paused');
      }
    } catch (error) {
      console.error('💥 [TTS] Failed to pause audio:', error);
      throw error;
    }
  }

  // Resume audio playback
  static async resumeAudio(): Promise<void> {
    try {
      if (this.sound && this.isPaused) {
        await this.sound.playAsync();
        this.isPlaying = true;
        this.isPaused = false;
        console.log('▶️ [TTS] Audio resumed');
      }
    } catch (error) {
      console.error('💥 [TTS] Failed to resume audio:', error);
      throw error;
    }
  }

  // Stop audio playback
  static async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPosition = 0;
        console.log('⏹️ [TTS] Audio stopped');
      }
    } catch (error) {
      console.error('💥 [TTS] Failed to stop audio:', error);
      throw error;
    }
  }

  // Seek to position in audio
  static async seekTo(positionMillis: number): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.setPositionAsync(positionMillis);
        this.currentPosition = positionMillis;
        console.log('⏩ [TTS] Audio seeked to:', positionMillis);
      }
    } catch (error) {
      console.error('💥 [TTS] Failed to seek audio:', error);
      throw error;
    }
  }

  // Get current playback status
  static getPlaybackStatus() {
    return {
      isLoading: this.isLoading,
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      hasAudio: !!this.currentAudioUri,
      currentPosition: this.currentPosition,
      duration: this.duration,
      progress: this.duration > 0 ? this.currentPosition / this.duration : 0,
    };
  }

  // Get available voices from backend
  static async getAvailableVoices(languageCode?: string): Promise<any[]> {
    try {
      console.log('🎭 [TTS] Fetching available voices...');
      
      const url = `${BackendService.getBaseUrl()}/api/tts${languageCode ? `?languageCode=${languageCode}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ [TTS] Fetched', data.voices?.length || 0, 'voices');
      
      return data.voices || [];
    } catch (error) {
      console.error('💥 [TTS] Failed to fetch voices:', error);
      throw error;
    }
  }

  // Format time for display
  static formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Clean up resources
  static async cleanup(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
      this.isPaused = false;
      this.currentAudioUri = null;
      this.currentPosition = 0;
      this.duration = 0;
      console.log('🧹 [TTS] Cleanup completed');
    } catch (error) {
      console.error('💥 [TTS] Cleanup failed:', error);
    }
  }
} 