# 01 - Pit Wall: Implementation Plan

This document outlines the plan to build the "Pit Wall" screen, an intelligent feed powered by the Paddock AI.

## Guiding Principles

-   **AI-First**: The core feature is the AI-driven recommendations. The backend RAG service must be built before the UI.
-   **Unified Backend**: The Pit Wall will be powered by the same core Paddock AI service that is used for "Ask the Paddock" and "Smart Debates".
-   **Component-Based UI**: The feed will be built from a library of reusable "data card" components for AI recommendations, standard data, and stories.

---

## Phase 1: Build the Core AI Backend (Paddock AI Service)

**Goal:** Build the "brain" that will power the Pit Wall. This is the same backend service required for all Paddock AI features.

### 1.1: Select and Integrate Live F1 Data API
- **Choose a Data Source**: For development, we will use the free [Ergast API](http://ergast.com/mrg/). It provides comprehensive data for race results, standings, and schedules. For a production app with true real-time data, we would need to switch to a paid provider.
- **Integrate into Backend**: Our Paddock AI backend service will be responsible for fetching this live data. This data will act as the "trigger" for generating proactive recommendations.

### 1.2: Set Up the Knowledge Base & Vector Database
-   Gather key F1 documents (rulebooks, technical articles, etc.).
-   Set up a vector database (e.g., Supabase pgvector) to store the document embeddings.

### 1.3: Create the RAG Backend Service
-   Create a serverless function that takes a query, finds relevant documents from the vector database, and uses a completion model (e.g., GPT-4) to generate an answer or explanation.

### 1.4: Create a New App Service (`services/paddockAiService.ts`)
-   This service in the mobile app will communicate with the backend. It will have functions to support both direct questions (`askQuestion`) and proactive recommendations (`getRecommendationForEvent`).

**Acceptance Criteria:**
- The AI backend is functional and can generate contextually relevant explanations for given F1 events (e.g., "pit stop").

---

## Phase 2: Building the Pit Wall Screen & UI

**Goal:** Create the frontend for the Pit Wall, including the new AI-powered recommendation cards.

### 2.1: Create the Screen and Basic Layout
-   Create a new screen at `screens/pit-wall/PitWallScreen.tsx`.
-   The screen will use a vertical `FlatList`.

### 2.2: Design and Create "Data Card" Components
-   In `components/pit-wall/`, create:
    -   `RecommendationCard.tsx`: A special card to display AI-generated insights.
    -   `UpcomingRaceCard.tsx`: A card to display information about the next race, including a **track map** and schedule.
    -   `ArticleCard.tsx`: A card for linking to curated official F1 news articles.
    -   `VideoCard.tsx`: A card for embedding or linking to official F1 video content.
    -   `ResultsCard.tsx`, `StandingsCard.tsx`, etc., for standard data.
    -   `StoryCarousel.tsx`: The component to display the user story rings.

### 2.3: Integrate AI Service and Data
-   The `PitWallScreen` will now call our own backend service.
-   This service will return a combined list of items to display: AI recommendations, standard F1 data, etc.
-   The screen will render the appropriate card for each item type.

**Acceptance Criteria:**
- The "Pit Wall" screen displays a mix of AI recommendation cards, standard data cards, and the story carousel at the top.

---

## Phase 3: Story Integration
- This phase remains the same: the `StoryCarousel.tsx` will be rendered as the header of the `FlatList` in `PitWallScreen.tsx`, and all existing story functionality (`StoryViewerScreen`, etc.) will be preserved. 