# Application Features and Technical Specifications

## Overview

This application is a holistic health, wellness, and longevity tracking ecosystem designed to monitor and predict users' physical and mental trajectories. It employs sophisticated gamification principles (e.g., biological time earned, streaks) and advanced multi-modal AI models (LLMs and Vision APIs) for seamless data ingestion and predictive analysis.

## Core Modules & Features

### 1. Dashboard & Gamification Engine

- **Biological Time Earned (BTE):** Tracks a calculated "life extension" metric based on daily healthy habits (diet, mood, quests).
- **Vitality Streaks:** Monitors consecutive days of logging food, mood, or completing quests to build a streak that encourages consistent engagement.
- **Nutrition Ring Visualization:** An Apple-style rings interface (Move/Calories, Protein, Carbs) using SVG paths to provide an at-a-glance state of daily macronutrient and caloric progress against targeted goals.
- **Water Tracking:** Quick-add hydration logging built directly into the dashboard ribbon.

### 2. Multi-Modal Logging System

The application simplifies data entry by allowing natural inputs across text, voice, and images.

- **Dietary Analysis (Food Logging):**
  - Allows users to log meals using text, voice transcription, or image upload via device camera.
  - Generative AI parses natural language or images into structured macronutrient and caloric profiles.
- **Psycho-Somatic Event Logging (Mood Tracking):**
  - Evaluates emotional granularity utilizing principles like Plutchik's Wheel of Emotions.
  - Correlates physiological responses (sleep quality, stress levels) alongside emotional states through a `SomaticBodyMap`.
- **Clinical Biomarker Tracking:**
  - Facilitates extraction of clinical data (metabolic and lipid panels) via image uploads.
  - Uses AI OCR (Optical Character Recognition) to extract and categorize standard clinical reference ranges directly into a structured database log.

### 3. Predictive Anthropomorphic Simulation & Trajectory

- **Compare Timeline:** Synthesizes user clinical and behavioral inputs over time.
- **Visual Aging Projection:** Extrapolates physical aging manifestations over a 10-to-20-year horizon based on positive or negative behavioral trends.
- **Prescribed Regimen:** Formulates actionable, longitudinal lifestyle protocols targeting acute decay metrics via micro-habits.

### 4. Conversational Wellbeing Advisor

- **Advisor Chat:** An AI-driven companion that interfaces directly with users to provide real-time wellness coaching, answering questions, and providing context-based suggestions derived from the user's logged historical data.

### 5. Additional Support Modules

- **Future Letters:** Allows users to document intentions, reflections, or goals for their future self, adding a psychological and self-accountability layer to the health journey.
- **Notification Manager:** Manages periodic nudges and app-internal alerts.
- **Onboarding Slideshow:** Guides new users through physiological data privacy, clinical boundaries, and standard feature tutorials to ensure informed participation.

## Detailed Feature Specifications

### Profile Filling and Medical Context

The application maintains a highly detailed physiological profile for the user, acting as the fundamental baseline for all temporal projections and contextual AI generations.

- **Core Parameters:** Tracks chronological Age, Gender, Height (cm), Weight (kg), and calculates BMI dynamically.
- **Lifestyle Metrics:** Logs holistic variables such as Activity Level, Diet Quality, Smoking Status, Stress Levels, and Sleep Quality.
- **Clinical Data & Conditions:** Captures specific underlying Medical Conditions (e.g., hyperlipidemia, pre-diabetes) inputted by the user.
- **State Management:** Profile parameters are managed functionally in the `App.tsx` state and synchronized structurally with Firestore (`profiles` collection) utilizing real-time `onSnapshot` subscriptions. This extensive physiological footprint is injected continuously into all multi-modal generative prompts across the ecosystem layer to ensure AI operations remain tightly constrained to the user's baseline.

### Avatar Building Architecture

The Avatar Builder constructs a persistent visual identifier of the user that evolves dynamically while retaining foundational identity cohesion over time spans.

- **Reference Ingestion:** The user may select an overarching thematic style (e.g., abstract or realistic) and optionally upload an authentic base photo (`faceImage`) via the local device camera to ground the generation.
- **LLM Diagnostic Description Extraction (`extractAvatarDescription`):** To preserve identity strictly across time-lapsed generations, the core system invokes a semantic extraction routine via Google Gemini. This logic consumes exact demographics alongside the biometric image, returning an intensely descriptive 1-paragraph blueprint of physical architecture, body proportions, and phenotypic traits. This text bypasses numeric abstractions to prioritize visual rendering parameters.
- **Semantic Anchoring:** The output acts as a cached blueprint (`avatarDesc`). By supplying image generators with semantic body shape mapping alongside the base photo sequentially, the app dramatically minimizes identity drift—a critical barrier in longitudinal avatar simulations.

### Visual Comparison: Now and 10 Years

When rendering progression timelines, the system sequentially steps the user through immediate decay horizons, concluding in a highly striking Visual Comparison mapping "Now" versus "10 Years".

- **Image Generation Engine:** Leverages the advanced `gpt-5.4-mini` OpenAI model leveraging the `tools: [{type: "image_generation", model: "gpt-image-2"}]` API structure. Parameters are tuned for hyper-efficiency (`effort: "low"`, `verbosity: "low"`) to continuously generate assets.
- **Unoptimized Pathway Simulation:** Forecasts the user's visual deterioration specifically assuming they sustain their existing destructive or non-optimal lifestyle patterns without intervention.
- **X-Ray & Medical Transparency Layering:** Employs precise medical-style prompt engineering. Images incorporate "x-ray" cutaways or transparent overlays that graphically expose internal components like vascular systems (Arteries), Brain, and Heart condition. Generative logic explicitly binds physical manifestation severity and informative text labels directly to the user's `diseaseConditions`.
- **Glogau Metric Scaling:** Modifies physical traits mathematically utilizing biological age derivatives bound to the Glogau Wrinkle Scale to realistically alter physical appearance without excessive caricature.

### Take Control of Your Future Simulation

Serving as the concluding action stage, the "Take Control of Your Future" dashboard transforms simulation-induced anxiety into actionable recourse through an interactive data visualization section.

- **Optimized Trajectory Divergence:** The sequencer simultaneously forks and executes a parallel "Optimized 10 Years" timeline simulation in the background. It artificially shifts their parameters (reduces weight bounds by 10%, sets smoking to "Never", shifts diet to "Excellent", and activity to "Active") and renders fresh optimistic assets.
- **ImageComparisonSlider Element:** Presents highly tactile, drag-to-reveal sliders. Users horizontally swipe over the exact same anatomical region (external "Body" view or internal "Arteries" view) to intimately contrast the unoptimized biological decay versus the preserved vitality of the optimized path.
- **Risk Trajectory Charting:** Incorporates a dynamic Recharts `LineChart` that overlays the calculated quantitative risk slope over the decade, reinforcing the visual dichotomy with rigorous statistical divergence.

### Future Self Letters & Media Generation

To reinforce long-term behavioral adherence through the psychological principle of self-continuity, the application includes a "Future Self" feature that simulates a transmission from the user 10 years in the future.

- **Textual Narrative Generation:** The system passes the user's base profile and their projected 10-year trajectory (biological age, holistic health score) to the Gemini LLM. The LLM adopts a personalized future persona (e.g., "Your Future Self (2036)") to generate a poignant, therapeutic letter reflecting on the consequences of the user's current health trajectory.
- **Cinematic Video Generation (Veo):** If the user has uploaded an authentic base photo (`faceImage`), the application invokes the `generateVeoVideo` service. It constructs a prompt for a cinematic, dramatic portrait video of a person 10 years older, strictly preserving the user's gender and identity using their reference image. The prompt dictates a soft, emotional lighting and instructs the synthesized character to speak the message generated in the letter.
- **Media Attachment:** Once generated, the synthetic memory video is securely delivered within the Future Letter UI, allowing the user to read the message and watch an emotionally grounding video of their simulated older self delivering the transmission.

## Technical Specifications & Architecture

### Frontend Architecture

- **Framework:** React 18+ with Vite
- **Language:** TypeScript for end-to-end type safety (`export interface FoodLog`, `MoodLog`, `BiomarkerLog`, etc.)
- **Styling:** Tailwind CSS combined with custom SVGs and responsive layout grids.
- **Animations:** Extensive use of Framer Motion (`motion.div` patterns) for graceful entry/exit transitions and interface feeling.
- **Data Visualization:** Employs Recharts and custom SVG-based ring indicators for displaying nutrition, biomarkers, and timelines.
- **Component Library:** Headless UI elements typically via Radix UI (underpinning shadcn/ui components like Dialogs, Tooltips, Cards, Drawers).

### AI & Data Integration

- **Processing Engine:** Uses `@google/genai` (Gemini Models / Gemini Vision API) to interpret text, transcribe voice intents, and process unstructured image data (food photos, lipid/metabolic panels).
- **Data Storage:** All physiological data is processed either ephemerally during AI synthesis or explicitly targeted for localized databases to ensure user privacy.
- **AI Transparency:** Features `ModuleInfoDialog` explicitly stating purpose, data processing strategies, algorithmic transparency, and clinical limits to clarify the boundaries of the non-diagnostic wellness feature (Software as a Medical Device considerations).

### Security & Compliance (Non-diagnostic focus)

- **SaMD Disclaimer Integration:** Every AI-powered module (Biomarkers, Timeline Simulator, Dietary Extractor) includes explicit regulatory disclaimers explaining that insights are "illustrative, not exact clinical prognoses," positioning the tool strictly within general wellness guidelines.
- **Data Integrity:** Emphasizes transparent user control by processing non-critical elements server-side via generic API endpoints but minimizing Persistent Health Information (PHI) exposure in LLM training buffers.

### User Roles & Customization

- **Localization:** Prepared for multiple languages (e.g., specific references in code mapping content such as `loadingStatuses`).
- **Theming:** Clean dark/light structural overlays (custom deep purples `#3D2B56`, energetic neon accents for goal rings `#FA114F`, `#92FF00`, `#00E5FF`).
