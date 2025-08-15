import * as React from 'react';
import { ViewProps } from 'react-native';

declare module 'expo-camera' {
  export type CameraType = 'front' | 'back';
  export type FlashMode = 'off' | 'on' | 'auto' | 'torch';
  export type AutoFocus = 'on' | 'off';
  
  export const Type: {
    front: 'front';
    back: 'back';
  };

  export interface CameraCapturedPicture {
    width: number;
    height: number;
    uri: string;
    base64?: string;
    exif?: any;
  }

  export interface CameraProps extends ViewProps {
    type?: CameraType;
    flashMode?: FlashMode;
    autoFocus?: AutoFocus | boolean | string;
    onCameraReady?: () => void;
    onMountError?: (error: { message: string }) => void;
    children?: React.ReactNode;
  }

  export class Camera extends React.Component<CameraProps> {
    static Constants: {
      Type: {
        front: 'front';
        back: 'back';
      };
      AutoFocus: {
        on: 'on';
        off: 'off';
      };
    };
    
    static async requestCameraPermissionsAsync(): Promise<{ status: string }>;
    static async getCameraPermissionsAsync(): Promise<{ status: string }>;
    
    takePictureAsync(options?: {
      quality?: number;
      base64?: boolean;
      exif?: boolean;
    }): Promise<CameraCapturedPicture>;
  }

  export { Camera };
}
