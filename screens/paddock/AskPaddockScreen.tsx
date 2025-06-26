import React, { useState } from 'react';
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
import { askPaddock } from '../../services/paddockAiService';
import TypingIndicator from '../../components/paddock/TypingIndicator';

interface Message {
  text: string;
  isUser: boolean;
}

interface QuickAction {
  title: string;
  prompt: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export default function AskPaddockScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  // Strategic feature quick actions
  const quickActions: QuickAction[] = [
    {
      title: "What-If Analysis",
      prompt: "What if Verstappen had pitted 5 laps earlier in Abu Dhabi 2024?",
      icon: "analytics",
      color: "#00D2FF"
    },
    {
      title: "Historical Strategy",
      prompt: "Show me similar rain strategy decisions from F1 history",
      icon: "library",
      color: "#FF6B35"
    },
    {
      title: "Driver Rankings",
      prompt: "What is Max Verstappen's current championship ranking?",
      icon: "trophy",
      color: "#FFD700"
    },
    {
      title: "Tire Strategy",
      prompt: "Analyze the tire strategies from the most recent F1 race",
      icon: "car-sport",
      color: "#00C851"
    },
    {
      title: "Race Winner",
      prompt: "Who won the most recent F1 Grand Prix?",
      icon: "flag",
      color: "#E10600"
    },
    {
      title: "Strategy History",
      prompt: "Find similar safety car strategy decisions from F1 history",
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

  const formatAIResponse = (text: string) => {
    // Enhanced formatting for strategic analysis
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/^\*\s/gm, '• ') // Convert markdown lists to bullets
      .replace(/^#\s(.*$)/gm, '$1') // Remove markdown headers
      .trim();
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
              Tap a feature above or ask your own F1 strategic question below
            </Text>
          </View>
        )}

        {/* Chat Messages */}
        {messages.map((msg, index) => (
          <View 
            key={index} 
            style={[styles.messageBubble, msg.isUser ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={[styles.messageText, msg.isUser ? styles.userText : styles.aiText]}>
              {msg.isUser ? msg.text : formatAIResponse(msg.text)}
            </Text>
          </View>
        ))}
        
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

      {/* Reset Quick Actions Button */}
      {!showQuickActions && messages.length > 0 && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setMessages([]);
            setShowQuickActions(true);
          }}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.resetText}>New Analysis</Text>
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
  resetButton: {
    position: 'absolute',
    top: 60,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 5,
  },
}); 