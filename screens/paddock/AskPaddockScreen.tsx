import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { askPaddock, paddockAiService } from '../../services/paddockAiService';
import TypingIndicator from '../../components/paddock/TypingIndicator';
import { useNavigation } from '@react-navigation/native';

interface Message {
  text: string;
  isUser: boolean;
  expanded?: boolean;
}

interface QuickAction {
  title: string;
  prompt: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function AskPaddockScreen() {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [isPreloading, setIsPreloading] = useState(true);

  // Preload common responses and F1 data for faster interactions
  useEffect(() => {
    const preloadData = async () => {
      try {
        console.log('🚀 Preloading Paddock AI for instant responses...');
        
        // Preload common responses in background
        await paddockAiService.preloadCommonResponses();
        
        setIsPreloading(false);
        console.log('✅ Paddock AI ready for lightning-fast responses!');
      } catch (error) {
        console.warn('Preloading failed, but app will still work:', error);
        setIsPreloading(false);
      }
    };

    preloadData();
  }, []);

  // Strategic feature quick actions - optimized for shorter responses
  const quickActions: QuickAction[] = [
    {
      title: "What-If Analysis",
      prompt: "Quick what-if: Verstappen Spanish GP 2024 different strategy?",
      icon: "analytics",
      color: "#00D2FF"
    },
    {
      title: "Historical Strategy",
      prompt: "Brief: rain strategy examples from F1 history",
      icon: "library",
      color: "#FF6B35"
    },
    {
      title: "Driver Rankings",
      prompt: "Quick check: current championship standings?",
      icon: "trophy",
      color: "#FFD700"
    },
    {
      title: "Tire Strategy",
      prompt: "Brief: Spanish GP tire strategies summary",
      icon: "car-sport",
      color: "#00C851"
    },
    {
      title: "Race Winner",
      prompt: "Quick: latest GP winner and results?",
      icon: "flag",
      color: "#E10600"
    },
    {
      title: "Next Race",
      prompt: "Brief: British GP info and preview",
      icon: "time",
      color: "#9C27B0"
    }
  ];

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { text: input, isUser: true };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setShowQuickActions(false); // Hide quick actions after first message

    // Pass the history *before* the new user message
    const history = messages; 
    const aiResponse = await askPaddock(input, history);
    const aiMessage: Message = { text: aiResponse, isUser: false };
    
    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    // Auto-send the quick action
    setTimeout(() => {
      if (prompt) {
        setInput(prompt);
        // Trigger send with the prompt
        handleQuickActionSend(prompt);
      }
    }, 100);
  };

  const handleQuickActionSend = async (prompt: string) => {
    if (!prompt.trim() || loading) return;

    const userMessage: Message = { text: prompt, isUser: true };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setShowQuickActions(false);

    const history = messages;
    const aiResponse = await askPaddock(prompt, history);
    const aiMessage: Message = { text: aiResponse, isUser: false };
    
    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  const formatAIResponse = (text: string, messageIndex: number, isExpanded: boolean) => {
    // Enhanced formatting for strategic analysis
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/^\*\s/gm, '• ') // Convert markdown lists to bullets
      .replace(/^#\s(.*$)/gm, '$1') // Remove markdown headers
      .trim();
    
    // Limit response length for better mobile experience if not expanded
    const maxLength = 300; // ~2-3 sentences for preview
    const needsTruncation = formatted.length > maxLength;
    
    if (!isExpanded && needsTruncation) {
      formatted = formatted.substring(0, maxLength).trim() + '...';
    }
    
    return { formatted, needsTruncation };
  };

  const toggleMessageExpansion = (messageIndex: number) => {
    const newExpandedMessages = new Set(expandedMessages);
    if (expandedMessages.has(messageIndex)) {
      newExpandedMessages.delete(messageIndex);
    } else {
      newExpandedMessages.add(messageIndex);
    }
    setExpandedMessages(newExpandedMessages);
  };

  const requestMoreInformation = async (messageIndex: number) => {
    if (loading) return;
    
    const originalMessage = messages[messageIndex];
    if (originalMessage.isUser) return;
    
    // Create a follow-up question for more details
    const followUpPrompt = "Please provide more detailed information about your previous answer, including additional context and analysis.";
    
    const userMessage: Message = { text: followUpPrompt, isUser: true };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setLoading(true);

    const history = messages;
    const aiResponse = await askPaddock(followUpPrompt, history);
    const aiMessage: Message = { text: aiResponse, isUser: false };
    
    setMessages(prev => [...prev, aiMessage]);
    setLoading(false);
  };

  const handleBackPress = () => {
    // Try to go back if there's navigation history
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If no back history (e.g., root tab), reset the chat
      setMessages([]);
      setShowQuickActions(true);
      setExpandedMessages(new Set());
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🏎️ Paddock AI</Text>
        <Text style={styles.subtitle}>Advanced F1 Strategic Analysis</Text>
        {isPreloading && (
          <Text style={styles.preloadingText}>⚡ Optimizing for speed...</Text>
        )}
      </View>

      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {/* Quick Actions - Show when no messages */}
        {showQuickActions && messages.length === 0 && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Strategic Features</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.quickActionButton, { borderColor: action.color }]}
                  onPress={() => handleQuickAction(action.prompt)}
                >
                  <Ionicons name={action.icon} size={24} color={action.color} />
                  <Text style={styles.quickActionText}>{action.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.quickActionsHint}>
              {isPreloading 
                ? "⚡ Optimizing responses for instant results..." 
                : "🚀 Lightning-fast responses ready! Tap a feature above or ask your own F1 question"
              }
            </Text>
          </View>
        )}

        {/* Chat Messages */}
        {messages.map((msg, index) => {
          const isExpanded = expandedMessages.has(index);
          const aiResponse = !msg.isUser ? formatAIResponse(msg.text, index, isExpanded) : null;
          
          return (
            <View 
              key={index} 
              style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}
            >
              <Text style={[styles.messageText, msg.isUser ? styles.userText : styles.aiText]}>
                {msg.isUser ? msg.text : aiResponse?.formatted}
              </Text>
              
              {/* Show expand/collapse button for AI messages that need truncation */}
              {!msg.isUser && aiResponse?.needsTruncation && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => toggleMessageExpansion(index)}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? '📖 Show less' : '📚 Read more'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* More information button for AI messages */}
              {!msg.isUser && (
                <TouchableOpacity
                  style={styles.moreInfoButton}
                  onPress={() => requestMoreInformation(index)}
                >
                  <Text style={styles.moreInfoButtonText}>
                    💡 More details
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
        
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <TypingIndicator />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about strategies, what-if scenarios, driver rankings..."
          placeholderTextColor="#888"
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity 
          style={[styles.sendButton, loading && styles.sendButtonDisabled]} 
          onPress={handleSend} 
          disabled={loading}
        >
          <Ionicons name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Back Button */}
      {!showQuickActions && messages.length > 0 && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          onLongPress={async () => {
            // Clear cache on long press for debugging
            try {
              await paddockAiService.clearCache();
              console.log('🧹 Cache cleared via long press');
            } catch (error) {
              console.warn('Cache clear failed:', error);
            }
            setMessages([]);
            setShowQuickActions(true);
            setExpandedMessages(new Set());
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151E',
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  preloadingText: {
    fontSize: 12,
    color: '#00D2FF',
    marginTop: 3,
    fontStyle: 'italic',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  quickActionButton: {
    width: '48%',
    backgroundColor: '#1E1E28',
    borderRadius: 12,
    borderWidth: 2,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  quickActionsHint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    fontStyle: 'italic',
  },
  messageBubble: {
    padding: 15,
    borderRadius: 20,
    marginVertical: 8,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#E10600',
    alignSelf: 'flex-end',
  },
  aiBubble: {
    backgroundColor: '#1E1E28',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  aiText: {
    color: '#E0E0E0',
  },
  expandButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  expandButtonText: {
    color: '#00D2FF',
    fontSize: 12,
    fontWeight: '600',
  },
  moreInfoButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00D2FF',
    alignSelf: 'flex-start',
  },
  moreInfoButtonText: {
    color: '#00D2FF',
    fontSize: 11,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1A1A24',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E1E28',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#FFFFFF',
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sendButton: {
    backgroundColor: '#E10600',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 15,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
}); 