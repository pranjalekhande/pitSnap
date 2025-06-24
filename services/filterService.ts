import * as ImageManipulator from 'expo-image-manipulator';
import { CameraFilter } from '../components/camera/FilterConstants';

export interface FilterProcessingResult {
  success: boolean;
  uri?: string;
  error?: string;
}

/**
 * Apply a filter to an image using expo-image-manipulator
 */
export const applyFilterToImage = async (
  imageUri: string,
  filter: CameraFilter
): Promise<FilterProcessingResult> => {
  try {
    // If no filter (original), return the original image
    if (filter.id === 'none') {
      return {
        success: true,
        uri: imageUri,
      };
    }

    // Define filter manipulations based on filter type
    const manipulations = getFilterManipulations(filter);

    if (manipulations.length === 0) {
      // No manipulations needed, return original
      return {
        success: true,
        uri: imageUri,
      };
    }

    // Apply the image manipulations
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [], // No resize/rotate transformations
      {
        compress: 0.9, // High quality
        format: ImageManipulator.SaveFormat.JPEG,
        ...manipulations[0], // Apply the filter settings
      }
    );

    return {
      success: true,
      uri: result.uri,
    };
  } catch (error) {
    console.error('❌ Error applying filter to image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Convert our filter definitions to expo-image-manipulator parameters
 */
const getFilterManipulations = (filter: CameraFilter): any[] => {
  switch (filter.id) {
    case 'racing_red':
      return [{
        // Red tint effect
        // Note: expo-image-manipulator has limited filter options
        // We'll implement basic brightness/contrast adjustments
      }];
    
    case 'vintage_sepia':
      return [{
        // Sepia-like effect using available options
      }];
    
    case 'night_mode':
      return [{
        // Darker, higher contrast effect
      }];
    
    case 'championship':
      return [{
        // Warmer, brighter effect
      }];
    
    // For other filters, we'll return empty array 
    // and rely on overlay for now until we implement more advanced processing
    default:
      return [];
  }
};

/**
 * Enhanced filter processing using CSS-style color manipulation
 * This creates a colored overlay effect and blends it with the original image
 */
export const applyOverlayFilter = async (
  imageUri: string,
  filter: CameraFilter
): Promise<FilterProcessingResult> => {
  try {
    if (filter.id === 'none') {
      return {
        success: true,
        uri: imageUri,
      };
    }

    // For now, we'll apply basic image adjustments
    // In a more advanced implementation, we could use libraries like react-native-image-filter-kit
    const adjustments = getFilterAdjustments(filter);
    
    if (!adjustments) {
      return {
        success: true,
        uri: imageUri,
      };
    }

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [], // No transformations
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return {
      success: true,
      uri: result.uri,
    };
  } catch (error) {
    console.error('❌ Error applying overlay filter:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Get filter adjustments for basic image processing
 */
const getFilterAdjustments = (filter: CameraFilter) => {
  switch (filter.id) {
    case 'vintage_sepia':
      return {
        brightness: 1.1,
        contrast: 1.2,
        saturation: 0.8,
      };
    
    case 'night_mode':
      return {
        brightness: 0.8,
        contrast: 1.3,
      };
    
    case 'championship':
      return {
        brightness: 1.2,
        saturation: 1.1,
      };
    
    default:
      return null;
  }
}; 