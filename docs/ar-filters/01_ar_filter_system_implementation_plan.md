# AR Filter System Rework: Implementation Plan

This document outlines the technical plan to transition from a 2D image overlay filter system to a real-time, 3D AR filter system for F1-themed effects.

## Guiding Principles

- **Performance:** Prioritize a smooth, high-framerate user experience.
- **Modularity:** Each part of the system (camera, tracking, rendering) should be independent.
- **Scalability:** The new system should be easy to extend with new models and assets.

---

## Phase 1: Foundational Tech Upgrade

**Goal:** Replace the existing camera with a high-performance solution and set up a basic 3D rendering environment. This phase disconnects the current filter logic to focus on the new foundation.

**Key Libraries:**
- `react-native-vision-camera`: For high-performance camera access and frame processing.
- `react-three-fiber` & `@react-three/drei`: For declarative 3D rendering in React.
- `expo-gl`: The underlying WebGL API for Expo.

### 1.1: Install Dependencies

Add the required libraries to the project.
```bash
npx expo install react-native-vision-camera @react-three/fiber @react-three/drei expo-gl
```
*Note: `react-native-vision-camera` requires adding a plugin to `app.json` and rebuilding the development client.*

### 1.2: Refactor `CameraScreen.tsx`

1.  **Replace `expo-camera`:**
    -   Remove `import { CameraView, ... } from 'expo-camera';`.
    -   Import `VisionCamera`, `useCameraDevice`, and `useFrameProcessor`.
    -   Replace the `<CameraView>` component with `<Camera>`.
    -   Update camera state logic (e.g., `facing` to `device`).

2.  **Integrate a Basic 3D Scene:**
    -   Add a new component, e.g., `components/camera/ar/ARScene.tsx`.
    -   Inside `ARScene.tsx`, use `<Canvas>` from `react-three-fiber` to render a simple `<Box>` mesh from `@react-three/drei`.
    -   Overlay this `<ARScene>` component on top of the new `<Camera>` view in `CameraScreen.tsx`. It should be transparent to show the camera feed behind it.

**Acceptance Criteria:**
- The camera view is functional, using `react-native-vision-camera`.
- A 3D cube is rendered and visible on top of the camera feed.
- Existing photo/video capture logic is temporarily disabled or commented out to avoid conflicts.

---

## Phase 2: Real-Time Face Tracking

**Goal:** Implement real-time 3D face tracking using the camera's video feed.

**Key Libraries:**
- `@tensorflow/tfjs` & `@tensorflow-models/face-landmarks-detection`: For running the face mesh model.
- `react-native-reanimated`: For efficient data sharing between the UI thread and the frame processor thread.

### 2.1: Install TensorFlow.js Dependencies

```bash
npm install @tensorflow/tfjs @tensorflow-models/face-landmarks-detection @tensorflow/tfjs-react-native
```

### 2.2: Create the Frame Processor

1.  In `CameraScreen.tsx`, create a `useFrameProcessor` hook.
2.  Inside the frame processor, configure and run the TensorFlow.js `FaceMesh` model on each camera frame.
    - This is computationally expensive, so it must be done efficiently. Follow `vision-camera` examples for running ML models.
3.  Use a `Reanimated` shared value (`useSharedValue`) to store the detected 3D face landmarks. This allows the tracking data to be available on the UI thread without causing performance drops.

### 2.3: Visualize Tracking Data (For Debugging)

- In the `ARScene.tsx` component, read the shared value containing the face landmarks.
- For each landmark point, render a small dot or sphere in the 3D scene.

**Acceptance Criteria:**
- The frame processor runs the `FaceMesh` model on the live camera feed.
- A 3D point cloud representing the user's face is rendered and moves in sync with the user's head movements.

---

## Phase 3: Connecting Tracking to 3D Models

**Goal:** Replace the debug point cloud with an actual 3D helmet model that tracks the user's head.

### 3.1: Load a 3D Helmet Model

1.  Obtain a 3D helmet model in `.glb` or `.gltf` format and add it to your `assets`.
2.  In `ARScene.tsx`, use the `useGLTF` hook from `@react-three/drei` to load the helmet model.

### 3.2: Implement Head Pose Tracking

1.  The `FaceMesh` model provides the 3D coordinates of facial landmarks. Use these points (e.g., nose bridge, chin, forehead) to calculate the overall position, rotation (yaw, pitch, roll), and scale of the head.
2.  This requires some 3D math (vector calculations, matrix transformations). This is the most complex part of the implementation.
3.  Apply the calculated position, rotation, and scale to the loaded 3D helmet mesh in the `ARScene`.

### 3.3: Re-integrate UI

1.  Update `HelmetSelector.tsx` and `HelmetConstants.ts` to manage the state for different 3D helmet models instead of 2D images.
2.  Pass the selected helmet model down to the `ARScene` component.

**Acceptance Criteria:**
- A 3D helmet model is rendered on the user's head.
- The helmet accurately tracks the user's head position and rotation in real-time.
- The user can switch between different helmets using the existing UI.

---

## Phase 4: Person Segmentation (Podium Effect)

**Goal:** Implement the "on the podium" effect by separating the user from their background.

**Key Libraries:**
- `@tensorflow-models/body-segmentation`: For segmenting people from the background.

### 4.1: Create a Segmentation Frame Processor

- Similar to Phase 2, create a new frame processor that uses the `body-segmentation` model. This can be a separate mode from the face tracking.
- The model will output a mask of the detected person.

### 4.2: Combine Mask with 3D Scene

- Render the camera feed to a texture.
- In your `ARScene`, create a 3D podium scene.
- Apply the person mask to the camera texture, effectively "cutting out" the user.
- Place this cutout of the user into the 3D podium scene.

**Acceptance Criteria:**
- When a "podium" filter is selected, the user sees themselves separated from their real-world background and placed into a virtual 3D podium environment. 