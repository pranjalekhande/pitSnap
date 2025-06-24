import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { HelmetOverlay } from './HelmetConstants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoComposerProps {
  imageUri: string;
  helmet: HelmetOverlay;
  imageWidth: number;
  imageHeight: number;
}

export interface PhotoComposerRef {
  capturePhoto: () => Promise<string>;
}

export const PhotoComposer = forwardRef<PhotoComposerRef, PhotoComposerProps>(
  ({ imageUri, helmet, imageWidth, imageHeight }, ref) => {
    const viewRef = useRef<View>(null);

    useImperativeHandle(ref, () => ({
      capturePhoto: async () => {
        if (!viewRef.current) {
          throw new Error('View ref not available');
        }

        const uri = await captureRef(viewRef.current, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
        });

        return uri;
      },
    }));

    // Calculate helmet position and size based on image dimensions
    const helmetSize = Math.min(imageWidth, imageHeight) * 0.15; // 15% of smaller dimension
    const helmetX = imageWidth * 0.5 - helmetSize / 2; // Center horizontally
    const helmetY = imageHeight * 0.2; // 20% from top

    return (
      <View
        ref={viewRef}
        style={[
          styles.container,
          {
            width: imageWidth,
            height: imageHeight,
          }
        ]}
      >
        {/* Base Image */}
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.baseImage,
            {
              width: imageWidth,
              height: imageHeight,
            }
          ]}
          resizeMode="cover"
        />

        {/* Helmet Overlay */}
        {helmet.id !== 'none' && (
          <View
            style={[
              styles.helmetContainer,
              {
                left: helmetX,
                top: helmetY,
                width: helmetSize,
                height: helmetSize,
              }
            ]}
          >
            {/* Background Circle */}
            <View
              style={[
                styles.helmetBackground,
                {
                  backgroundColor: `${helmet.teamColor}20`,
                  borderColor: helmet.teamColor,
                  width: helmetSize,
                  height: helmetSize,
                  borderRadius: helmetSize / 2,
                }
              ]}
            />

            {/* Emoji */}
            <View style={styles.emojiContainer}>
              <Text
                style={[
                  styles.helmetEmoji,
                  {
                    fontSize: helmetSize * 0.6,
                  }
                ]}
              >
                {helmet.emoji}
              </Text>
            </View>

            {/* Team Label */}
            <View
              style={[
                styles.teamLabel,
                {
                  backgroundColor: helmet.teamColor,
                  top: helmetSize + 5,
                }
              ]}
            >
              <Text style={styles.teamLabelText}>{helmet.name}</Text>
            </View>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#000000',
  },
  baseImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  helmetContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helmetBackground: {
    position: 'absolute',
    borderWidth: 3,
    opacity: 0.9,
  },
  emojiContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  helmetEmoji: {
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  teamLabel: {
    position: 'absolute',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  teamLabelText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 