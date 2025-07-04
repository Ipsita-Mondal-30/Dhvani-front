// TODO: Migrate to expo-audio when it's fully stable
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
  private static mockPlaybackTimer: NodeJS.Timeout | null = null;
  private static mockStartTime = 0;
  private static seekDebounceTimer: NodeJS.Timeout | null = null;

  // Initialize the service
  static async initialize(): Promise<void> {
    try {
      console.log('🎤 [TTS] Initializing TTS Service...');
      
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
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

      // If text is too long, truncate it
      const maxLength = 4500; // Leave some buffer below 5000 limit
      let processedText = text;
      
      if (text.length > maxLength) {
        console.log(`⚠️ [TTS] Text too long (${text.length} chars), truncating to ${maxLength} chars`);
        processedText = text.substring(0, maxLength) + '...';
      }

      // Make API request to backend
      const response = await fetch(`${BackendService.getBaseUrl()}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: processedText,
          config,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [TTS] API Error:', response.status, errorText);
        
        // If TTS API is not available, create a mock audio file
        if (response.status === 404 || response.status === 405 || response.status === 503) {
          console.log('⚠️ [TTS] TTS API not available, creating mock audio...');
          const mockAudioUri = await this.createMockAudio(processedText);
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

  // Convert ArrayBuffer to base64 string
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const uint8Array = new Uint8Array(buffer);
    const chunkSize = 0x8000; // Process in smaller chunks to avoid memory issues
    let binary = '';
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }

  // Save audio data to file
  private static async saveAudioToFile(audioData: ArrayBuffer): Promise<string> {
    try {
      const fileName = `tts_audio_${Date.now()}.mp3`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      console.log('💾 [TTS] Saving audio to file:', fileUri);
      console.log('📊 [TTS] Audio data size:', audioData.byteLength, 'bytes');
      
      // Create a temporary file URI for writing binary data
      const tempUri = `${FileSystem.cacheDirectory}temp_${fileName}`;
      
      // Write the binary data directly to a temporary file
      await FileSystem.writeAsStringAsync(tempUri, TTSService.arrayBufferToBase64(audioData), {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Move the temporary file to its final location
      await FileSystem.moveAsync({
        from: tempUri,
        to: fileUri,
      });
      
      // Verify the file was created successfully
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      console.log('✅ [TTS] Audio file saved successfully');
      if (fileInfo.exists && 'size' in fileInfo) {
        console.log('📁 [TTS] File size:', fileInfo.size, 'bytes');
      }
      
      return fileUri;
    } catch (error) {
      console.error('💥 [TTS] Failed to save audio file:', error);
      throw error;
    }
  }

  // Create a mock audio file for testing when TTS API is not available
  private static async createMockAudio(text: string): Promise<string> {
    try {
      console.log('🎭 [TTS] Creating mock audio notification...');
      console.log('📝 [TTS] Mock audio represents:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));
      
      // Instead of creating a broken audio file, let's use a simple beep sound URI
      // or return a special identifier that we handle in the play method
      return 'mock://audio/beep';
    } catch (error) {
      console.error('💥 [TTS] Failed to create mock audio:', error);
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

      // Handle mock audio
      if (uri?.startsWith('mock://')) {
        console.log('🎭 [TTS] Playing mock audio - simulating playback');
        this.isPlaying = true;
        this.isPaused = false;
        this.duration = 3000; // 3 seconds mock duration
        this.mockStartTime = Date.now();
        this.currentPosition = 0;
        
        // Clear any existing timer
        if (this.mockPlaybackTimer) {
          clearInterval(this.mockPlaybackTimer);
          this.mockPlaybackTimer = null;
        }
        
        // Simulate playback progress
        this.mockPlaybackTimer = setInterval(() => {
          try {
            if (this.isPlaying && !this.isPaused) {
              const elapsed = Date.now() - this.mockStartTime;
              this.currentPosition = Math.min(elapsed, this.duration);
              
              if (this.currentPosition >= this.duration) {
                console.log('🏁 [TTS] Mock audio playback finished');
                this.isPlaying = false;
                this.isPaused = false;
                this.currentPosition = 0;
                if (this.mockPlaybackTimer) {
                  clearInterval(this.mockPlaybackTimer);
                  this.mockPlaybackTimer = null;
                }
              }
            }
          } catch (error) {
            console.error('💥 [TTS] Mock playback error:', error);
            this.isPlaying = false;
            this.isPaused = false;
            if (this.mockPlaybackTimer) {
              clearInterval(this.mockPlaybackTimer);
              this.mockPlaybackTimer = null;
            }
          }
        }, 100);
        
        return;
      }

      // Unload previous sound if exists
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // Validate that the file exists and is readable
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      console.log('📁 [TTS] Audio file info:', fileInfo);

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
      this.sound.setOnPlaybackStatusUpdate((status: any) => {
        if (!status) return;
        
        if (status.isLoaded) {
          this.currentPosition = status.positionMillis ?? 0;
          this.duration = status.durationMillis ?? 0;
          this.isPlaying = status.isPlaying ?? false;
          
          if (status.didJustFinish) {
            console.log('🏁 [TTS] Audio playback finished');
            this.isPlaying = false;
            this.isPaused = false;
            this.currentPosition = 0;
          }
        } else {
          console.log('⚠️ [TTS] Audio not loaded:', status);
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
      if (this.isPlaying) {
        if (this.currentAudioUri?.startsWith('mock://')) {
          // Handle mock audio pause
          this.isPlaying = false;
          this.isPaused = true;
          console.log('⏸️ [TTS] Mock audio paused');
        } else if (this.sound) {
          await this.sound.pauseAsync();
          this.isPlaying = false;
          this.isPaused = true;
          console.log('⏸️ [TTS] Audio paused');
        }
      }
    } catch (error) {
      console.error('💥 [TTS] Failed to pause audio:', error);
      throw error;
    }
  }

  // Resume audio playback
  static async resumeAudio(): Promise<void> {
    try {
      if (this.isPaused) {
        if (this.currentAudioUri?.startsWith('mock://')) {
          // Handle mock audio resume
          this.isPlaying = true;
          this.isPaused = false;
          this.mockStartTime = Date.now() - this.currentPosition; // Adjust start time
          console.log('▶️ [TTS] Mock audio resumed');
        } else if (this.sound) {
          await this.sound.playAsync();
          this.isPlaying = true;
          this.isPaused = false;
          console.log('▶️ [TTS] Audio resumed');
        }
      }
    } catch (error) {
      console.error('💥 [TTS] Failed to resume audio:', error);
      throw error;
    }
  }

  // Stop audio playback
  static async stopAudio(): Promise<void> {
    try {
      if (this.currentAudioUri?.startsWith('mock://')) {
        // Handle mock audio stop
        this.isPlaying = false;
        this.isPaused = false;
        this.currentPosition = 0;
        if (this.mockPlaybackTimer) {
          clearInterval(this.mockPlaybackTimer);
          this.mockPlaybackTimer = null;
        }
        console.log('⏹️ [TTS] Mock audio stopped');
      } else if (this.sound) {
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
      // Clear any existing debounce timer
      if (this.seekDebounceTimer) {
        clearTimeout(this.seekDebounceTimer);
      }

      // Update the current position immediately for UI feedback
      this.currentPosition = positionMillis;

      // Debounce the actual seek operation
      this.seekDebounceTimer = setTimeout(async () => {
        if (this.sound) {
          // Only seek if we're not at the target position already
          const status = await this.sound.getStatusAsync() as any;
          if (Math.abs(status.positionMillis - positionMillis) > 50) {
            await this.sound.setPositionAsync(positionMillis);
            console.log('⏩ [TTS] Audio seeked to:', positionMillis);
          }
        }
      }, 100); // Wait 100ms before actually seeking
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
      // Stop any ongoing playback first
      try {
        await this.stopAudio();
      } catch (error) {
        console.warn('⚠️ [TTS] Error stopping audio during cleanup:', error);
      }
      
      // Clear mock timer
      if (this.mockPlaybackTimer) {
        clearInterval(this.mockPlaybackTimer);
        this.mockPlaybackTimer = null;
      }
      
      // Unload sound
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
        } catch (error) {
          console.warn('⚠️ [TTS] Error unloading sound during cleanup:', error);
        }
        this.sound = null;
      }
      
      // Reset all state
      this.isPlaying = false;
      this.isPaused = false;
      this.isLoading = false;
      this.currentAudioUri = null;
      this.currentPosition = 0;
      this.duration = 0;
      this.mockStartTime = 0;
      
      console.log('🧹 [TTS] Cleanup completed');
    } catch (error) {
      console.error('💥 [TTS] Cleanup failed:', error);
      // Don't throw error during cleanup to avoid app crashes
      console.warn('⚠️ [TTS] Continuing despite cleanup error');
    }
  }
} 