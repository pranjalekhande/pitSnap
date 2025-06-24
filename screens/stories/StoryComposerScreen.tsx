import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { createStory } from '../../services/storiesService';
import { uploadMedia } from '../../services/mediaService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type StoryComposerRouteParams = {
  StoryComposer: {
    mediaUri: string;
    mediaType: 'photo' | 'video';
  };
};

type StoryComposerRouteProp = RouteProp<StoryComposerRouteParams, 'StoryComposer'>;

export default function StoryComposerScreen() {
  const navigation = useNavigation();
  const route = useRoute<StoryComposerRouteProp>();
  const { mediaUri, mediaType } = route.params;
  
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const videoPlayer = useVideoPlayer(
    mediaType === 'video' ? mediaUri : null,
    player => {
      player.loop = true;
      player.muted = false;
      if (mediaType === 'video') {
        player.play();
      }
    }
  );

  const handlePostStory = async () => {
    if (isPosting) return;

    setIsPosting(true);
    try {
      // Map camera media type to database media type
      const dbMediaType = mediaType === 'photo' ? 'image' : 'video';
      
      // Upload media to Supabase Storage
      const uploadResult = await uploadMedia(
        mediaUri, 
        `story_${Date.now()}`, 
        dbMediaType
      );
      
      if (!uploadResult.success || !uploadResult.publicUrl) {
        Alert.alert('Error', 'Failed to upload media. Please try again.');
        return;
      }

      // Create story in database
      const success = await createStory(
        uploadResult.publicUrl,
        dbMediaType,
        caption.trim() || undefined
      );

      if (success) {
        Alert.alert(
          'Story Posted!', 
          'Your story has been shared with your friends.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to Stories feed
                navigation.navigate('StoriesFeed' as never);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to post story. Please try again.');
      }
    } catch (error) {
      console.error('Error posting story:', error);
      Alert.alert('Error', 'Failed to post story. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Discard Story?',
      'Are you sure you want to discard this story?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Discard', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <StatusBar style="light" />
          
          {/* Media Preview */}
          <View style={styles.mediaContainer}>
        {mediaType === 'video' ? (
          <VideoView
            style={styles.media}
            player={videoPlayer}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
          />
        ) : (
          <Image 
            source={{ uri: mediaUri }}
            style={styles.media}
            resizeMode="cover"
          />
        )}
        
        {/* Media Type Icon */}
        <View style={styles.mediaTypeIndicator}>
          <Ionicons 
            name={mediaType === 'video' ? 'videocam' : 'camera'} 
            size={16} 
            color="#FFFFFF" 
          />
        </View>
      </View>

      {/* Caption Input */}
      <View style={styles.captionContainer}>
        <Text style={styles.captionLabel}>Add a caption (optional)</Text>
        <TextInput
          ref={textInputRef}
          style={styles.captionInput}
          placeholder="What's happening?"
          placeholderTextColor="#666"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
          textAlignVertical="top"
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
          blurOnSubmit={true}
        />
        <Text style={styles.characterCount}>
          {caption.length}/200
        </Text>
      </View>

      {/* Story Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color="#FFFFFF" />
          <Text style={styles.detailText}>Expires in 24 hours</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color="#FFFFFF" />
          <Text style={styles.detailText}>Visible to all friends</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
          <Text style={styles.detailText}>You'll see who viewed it</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isPosting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.postButton,
            isPosting && styles.postButtonDisabled
          ]}
          onPress={handlePostStory}
          disabled={isPosting}
        >
          <Text style={styles.postButtonText}>
            {isPosting ? 'Posting...' : 'Post Story'}
          </Text>
          {!isPosting && (
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E',
  },
  mediaContainer: {
    position: 'relative',
    width: screenWidth * 0.6,
    height: screenWidth * 0.8,
    alignSelf: 'center',
    marginTop: 80,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E10600',
  },
  media: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1E1E28',
  },
  mediaTypeIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 6,
  },
  captionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  captionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  captionInput: {
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 80,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
  },
  characterCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 5,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
    opacity: 0.8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 'auto',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#1E1E28',
    borderRadius: 25,
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postButton: {
    flex: 2,
    backgroundColor: '#E10600',
    borderRadius: 25,
    paddingVertical: 15,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  postButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
}); 