# PitSnap: System Robustness & Production Plan

## 1. Executive Summary

This document provides a high-level overview of the PitSnap application's architecture, outlining the strategy to ensure it is robust, scalable, and ready for a production launch on the App Store. It synthesizes our discussions on integrating advanced features like the **Pit Wall** and **Paddock AI**, detailing a modern approach to architecture, deployment, and testing. The core takeaway is that PitSnap is being built on a professional-grade, decoupled microservice architecture, which is the industry standard for complex, scalable applications.

---

## 2. System Architecture: A Modern Microservice Approach

Our key architectural decision is to build the Paddock AI as a separate **microservice**, which communicates with the existing PitSnap application but runs independently.

-   **React Native Frontend (The App):** The user-facing Expo application that you interact with.
-   **Supabase Backend (The Original Backend):** Continues to handle its core responsibilities: user authentication, chat, stories, and user profiles.
-   **Paddock AI Backend (The New "Brain"):** A new, dedicated Python service that handles all complex AI logic. This includes the LangChain RAG pipeline, communication with OpenAI and Pinecone, and fetching data from F1 APIs.

#### Why is this a robust architecture?
-   **Separation of Concerns:** If the AI service experiences heavy load, it will not slow down or crash the core app features like chat or login.
-   **Best Tool for the Job:** It allows us to use Python's best-in-class AI ecosystem for the AI features, while keeping the main app in the efficient React Native/Supabase stack.
-   **Independent Scalability:** We can scale the AI service and the Supabase service independently, which is more cost-effective and efficient.

---

## 3. Production & App Store Launch Plan

This architecture is designed from the ground up to be deployed to production and submitted to the App Store.

#### How will the backend go live?
-   **Containerization:** The Python AI service will be packaged into a **Docker container**. This makes it a portable, self-contained unit that runs the same everywhere.
-   **Serverless Deployment:** We will deploy this container to a managed, serverless platform like **Google Cloud Run**. This is highly scalable (it can handle millions of users or scale to zero, so you only pay for what you use) and removes the need to manage servers.
-   **Automation (CI/CD):** We will use **GitHub Actions** to automatically build and deploy new versions of the AI service whenever we push code, ensuring a reliable and automated release process.

#### How will the app be launched?
-   The mobile app will be built using **Expo Application Services (EAS)**, the standard for building production-ready Expo apps.
-   EAS will create the final `.ipa` (for Apple) and `.aab` (for Android) files needed by the stores.
-   EAS will also handle the process of submitting these files to the Apple App Store and Google Play Store.

---

## 4. Comprehensive Testing Strategy

To ensure a high-quality app, we will implement a multi-layered testing strategy.

-   **Frontend Testing (The Expo App):**
    -   **Unit Tests (Jest & Testing Library):** We will test small, individual components (like a `ResultsCard`) and functions in isolation.
    -   **End-to-End Tests (Maestro):** We will write scripts to automate complete user journeys, like logging in, viewing the Pit Wall, and asking the Paddock AI a question. This ensures the app works as expected from a user's perspective.

-   **Backend Testing (The Python AI Service):**
    -   We will use **pytest** to thoroughly test our API endpoints and AI logic.
    -   Crucially, all tests will use **mock data** for external services (OpenAI, Pinecone, F1 APIs). This makes our tests fast, reliable, and free to run, as they don't make real API calls. 