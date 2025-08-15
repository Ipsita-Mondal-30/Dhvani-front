import * as React from 'react';

declare module 'expo-camera' {
  export type CameraType = 'front' | 'back';
  
  export interface CameraCapturedPicture {
    uri: string;
    width: number;
    height: number;
    base64?: string;
    exif?: any;
  }

  export interface CameraProps {
    style?: any;
    type?: CameraType;
    ref?: React.RefObject<{
      takePictureAsync(options?: {
        quality?: number;
        base64?: boolean;
        exif?: boolean;
      }): Promise<CameraCapturedPicture>;
    }>;
    autoFocus?: 'on' | 'off' | boolean;
    children?: React.ReactNode;
  }

  export const Camera: React.ForwardRefExoticComponent<
    CameraProps & React.RefAttributes<{
      takePictureAsync(options?: {
        quality?: number;
        base64?: boolean;
        exif?: boolean;
      }): Promise<CameraCapturedPicture>;
    }>
  >;

  export function requestCameraPermissionsAsync(): Promise<{ status: string }>;
  export function getCameraPermissionsAsync(): Promise<{ status: string }>;
}
