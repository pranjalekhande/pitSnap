# 01 - Paddock AI: Implementation Plan

This document outlines the phased implementation plan for the "Paddock AI" feature suite, prioritizing the AI service, the "Ask the Paddock" screen, and the "Smart Debates" integration.

## Guiding Principles

-   **Build the Brain First**: Develop and test the core AI service (the RAG model) independently before integrating it into the UI.
-   **Single Source of Truth**: All AI interactions, whether from the dedicated screen or in-chat, will go through a single, unified service.
-   **Distinct AI Identity**: The AI's messages and presence should be visually distinct from regular users'.

---

## Phase 1: Core AI Service & Knowledge Base

**Goal:** Build the "brain" of the Paddock AI. This involves setting up a backend service that can answer questions based on a curated set of F1 documents.

**Note: This is the same core service that will power the proactive recommendations in the "Pit Wall" feature. Building it is a prerequisite for both features.**

### 1.1: Set Up the Knowledge Base

1.  **Gather Documents**: Collect key F1 documents to serve as the AI's knowledge source. This includes:
    -   FIA Formula 1 Sporting Regulations (PDF)
    -   FIA Formula 1 Technical Regulations (PDF)
    -   Recent F1 news articles and race summaries.
2.  **Vector Database**: Choose and set up a vector database (e.g., Pinecone, Supabase pgvector) to store embeddings of the knowledge base documents.
3.  **Embedding Pipeline**: Create a script that reads the documents, chunks them into smaller pieces, generates embeddings using a model like `text-embedding-ada-002`, and stores them in the vector database.

### 1.2: Create the RAG Backend Service

1.  **Set Up a Serverless Function**: Create a new serverless function (e.g., using Supabase Edge Functions or AWS Lambda) that will orchestrate the RAG process.
2.  **Implement the RAG Logic**:
    -   The function will accept a user's question (`query`).
    -   It will generate an embedding for the `query`.
    -   It will query the vector database to find the most relevant document chunks (the "context").
    -   It will pass the `query` and the `context` to a completion model (e.g., GPT-4, Llama 3) with a carefully crafted prompt, instructing it to answer the question *only* using the provided context.
    -   The function will return the AI's answer as a JSON response.

### 1.3: Create a New App Service

-   Create `services/paddockAiService.ts` in the mobile app.
-   This service will have one function, `askQuestion(question: string)`, which calls the serverless function and returns the AI's response.

**Acceptance Criteria:**
-   The vector database is populated with F1 knowledge.
-   The serverless function can successfully answer questions based on the knowledge base.
-   The `paddockAiService.ts` can successfully call the backend and get a response. (This can be tested with a simple button in the app).

---

## Phase 2: "Ask the Paddock" Screen (Priority 1)

**Goal:** Create a dedicated, full-screen UI for users to have a direct conversation with the Paddock AI.

### 2.1: Create the UI

1.  **New Screen**: Create a new file `screens/paddock/AskPaddockScreen.tsx`.
2.  **Chat Interface**: Build a UI similar to `IndividualChatScreen.tsx`, with a message list and a text input at the bottom.
3.  **State Management**: Use `useState` to manage the list of messages in the conversation.

### 2.2: Integrate the AI Service

1.  **Sending Messages**: When the user sends a message, add it to the message list and immediately show a "typing indicator". Then, call the `askQuestion` function from `paddockAiService.ts`.
2.  **Receiving Responses**: When the response comes back, add the AI's message to the list and remove the typing indicator.
3.  **Message Styling**: Create a unique style for AI messages (e.g., different background color, an AI avatar) to distinguish them from the user's messages.

**Acceptance Criteria:**
-   Users can navigate to a new "Ask the Paddock" screen.
-   Users can have a back-and-forth conversation with the Paddock AI.
-   The conversation history is displayed in a chat-like interface.

---

## Phase 3: "Smart Debates" Chat Integration (Priority 2)

**Goal:** Allow users to tag the Paddock AI in their group chats to get factual answers.

### 3.1: Update the Chat Service & UI

1.  **Modify `messagesService.ts`**:
    -   Update the `Message` type to include an optional `is_from_ai: boolean` field and an optional `ai_query: string` field (to show what question the AI is answering).
2.  **Modify `IndividualChatScreen.tsx`**:
    -   **Input Logic**: In `handleSendTextMessage`, add logic to check if a message starts with `@PaddockAI`.
    -   **Trigger AI**: If it does, extract the question, call `paddockAiService.ts`'s `askQuestion` function.
    -   **Send AI Message**: Instead of sending the user's `@PaddockAI...` message, use the `sendMessage` function to post the AI's *response* to the chat, making sure to set `is_from_ai: true` and including the original question in `ai_query`.
    -   **Rendering Logic**: In `renderMessage`, check for `is_from_ai`. If true, render a special "AI Answer" message bubble. This bubble should be clearly styled and could show the original question that was asked.

**Acceptance Criteria:**
-   In any chat, typing `@PaddockAI What is DRS?` triggers the AI.
-   A special message bubble appears in the chat from "Paddock AI" containing the answer to "What is DRS?".
-   All participants in the chat can see the question and the AI's answer. 