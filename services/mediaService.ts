import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

// Helper function to decode base64 to Uint8Array (React Native compatible)
function base64ToUint8Array(base64: string): Uint8Array {
  // Simple base64 decoder that works in React Native
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < base64.length) {
    const encoded1 = chars.indexOf(base64[i++]);
    const encoded2 = chars.indexOf(base64[i++]);
    const encoded3 = chars.indexOf(base64[i++]);
    const encoded4 = chars.indexOf(base64[i++]);
    
    const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  const bytes = new Uint8Array(result.length);
  for (let i = 0; i < result.length; i++) {
    bytes[i] = result.charCodeAt(i);
  }
  return bytes;
}

// Upload media to Supabase Storage (proper cloud storage)
export const uploadMedia = async (
  localUri: string, 
  fileName: string,
  mediaType: 'image' | 'video'
): Promise<UploadResult> => {
  try {
    console.log('🔄 Starting media upload to Supabase Storage');
    console.log('📁 Local URI:', localUri);

    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      console.error('❌ File does not exist at path:', localUri);
      return { success: false, error: 'File does not exist' };
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = mediaType === 'image' ? 'jpg' : 'mp4';
    const uniqueFileName = `${timestamp}_${fileName}.${fileExtension}`;

    console.log('☁️ Uploading to Supabase Storage:', uniqueFileName);

    // Upload to Supabase Storage using base64 decode
    const { data, error } = await supabase.storage
      .from('pitsnap-media')
      .upload(uniqueFileName, base64ToUint8Array(base64), {
        contentType: mediaType === 'image' ? 'image/jpeg' : 'video/mp4',
        upsert: false
      });

    if (error) {
      console.error('❌ Supabase Storage upload failed:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('pitsnap-media')
      .getPublicUrl(uniqueFileName);

    console.log('✅ Upload successful! Public URL:', publicUrl);

    return { 
      success: true, 
      publicUrl: publicUrl 
    };

  } catch (error) {
    console.error('❌ Media upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

// Delete media from storage (for cleanup)
export const deleteMedia = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('pitsnap-media')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting media:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Media deletion error:', error);
    return false;
  }
};

// Get signed URL for private media (if needed)
export const getSignedUrl = async (filePath: string, expiresIn: number = 3600): Promise<string | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('pitsnap-media')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL error:', error);
    return null;
  }
}; 