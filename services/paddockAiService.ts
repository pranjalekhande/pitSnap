// NOTE: In a real production app, you would use environment variables
// to switch between a local dev URL and a live production URL.

// Choose based on your testing method:
const API_URL = "http://10.0.0.69:8000";  // For physical phone on local network
// const API_URL = "http://127.0.0.1:8000";  // For simulator only

interface Message {
  text: string;
  isUser: boolean;
}

/**
 * Sends a question and conversation history to the Paddock AI backend.
 * @param question The new question to ask the AI.
 * @param chatHistory The previous messages in the conversation.
 * @returns The AI's answer as a string.
 */
export async function askPaddock(question: string, chatHistory: Message[]): Promise<string> {
  console.log("Sending question to Paddock AI:", question);
  console.log("With history:", chatHistory);

  try {
    const response = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        question,
        chat_history: chatHistory 
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error ${response.status}:`, errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log("Received answer from Paddock AI:", data.answer);
    return data.answer;

  } catch (error) {
    console.error("Error asking Paddock AI:", error);
    
    // More specific error messages
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      return "🔌 Connection failed. Make sure the Paddock AI backend is running on your local network.";
    } else if (error instanceof Error && error.message.includes('timeout')) {
      return "⏱️ Request timed out. The AI is thinking hard about your strategic question - please try again.";
    } else {
      return "🤖 Sorry, I'm having trouble with the strategic analysis right now. Please try again in a moment.";
    }
  }
} 