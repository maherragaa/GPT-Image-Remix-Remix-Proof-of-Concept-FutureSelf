# FutureSelf - UX/UI Improvement Suggestions (Mobile & Desktop)

This document outlines key suggestions to improve the user experience (UX) and user interface (UI) of the FutureSelf application, with a strong emphasis on mobile responsiveness and usability.

## 1. Mobile Navigation & Toolbar
*   **Current State:** The app uses a floating vertical toolbar on the left side of the screen.
*   **Issue:** On mobile devices, vertical screen space is abundant, but horizontal space is strictly limited. A left-floating toolbar can overlap content or reduce the available width for reading complex data (like charts or action plans).
*   **Recommendation:** Move to a **Bottom Navigation Bar** for mobile screens (`< sm` or `< md` breakpoints). Core actions (Home/Dashboard, Add Food, Log Mood, Track Vitals, Chat) should be anchored to the bottom. Less frequently used actions can be placed in a "More" menu or a slide-out hamburger drawer.

## 2. Onboarding & Form Density
*   **Current State:** The onboarding flow has several steps, but Step 3 (Medical Profile / Biomarkers) contains a very long list of inputs.
*   **Issue:** On mobile, scrolling through a long, dense list of number inputs can lead to form fatigue.
*   **Recommendation:** 
    *   **Progressive Disclosure:** Group biomarkers into logical categories (e.g., "Lipids", "Blood Sugar", "Vitals") using collapsible accordions or horizontal swipeable tabs within the step.
    *   **Auto-advance:** For single-choice questions (like Activity Level or Diet), consider auto-advancing to the next question upon selection to reduce taps.

## 3. Data Visualization (Charts) on Mobile
*   **Current State:** Charts are rendered using `recharts` within standard container divs.
*   **Issue:** Complex charts (like the 10-year progression or mood trends) can become unreadable when squeezed into a 320px-wide screen. Legends and axes labels often overlap or get cut off.
*   **Recommendation:**
    *   Implement **Swipeable Chart Views**: Instead of showing one dense chart with all metrics, allow users to swipe laterally to view different metrics (e.g., Weight vs. Artery Health vs. Brain Health).
    *   **Simplified Tooltips:** Ensure chart tooltips are touch-friendly. They should lock on tap rather than requiring a hover state, and display large, clear typography.

## 4. Typography and Touch Targets
*   **Current State:** The app makes use of small utility classes like `text-[10px]` or `text-xs` for labels.
*   **Issue:** On high pixel density mobile screens or outdoors, very small text with low contrast (e.g., `text-black/40`) is difficult to read. Furthermore, small buttons can cause mis-taps.
*   **Recommendation:**
    *   **Minimum Touch Targets:** Ensure all interactive elements (buttons, toggles, sliders, tooltip triggers) have a minimum touch area of **44x44 pixels**, following Apple/Android HIG standards.
    *   **Legibility:** Increase the minimum font size for secondary text to at least `text-xs` (12px), but prefer `text-sm` (14px) on mobile viewports. Increase the contrast of placeholder text and secondary labels.

## 5. Floating Modals and Drawers
*   **Current State:** Features like the AI Wellbeing Advisor, Mood Logging, and Biomarker editing open in overlay drawers/modals.
*   **Issue:** If a drawer opens fully covering the screen, the "Close" button at the top might be difficult to reach with one hand on larger phones (Pro Max / Ultra devices).
*   **Recommendation:**
    *   **Bottom Sheet Pattern:** For quick entries (like logging mood or a single food item), use a Bottom Sheet that only takes up 50-70% of the screen height. 
    *   **Swipe-to-Dismiss:** Implement swipe-down gestures to dismiss overlays. This is a common and expected mobile interaction pattern.

## 6. The "Future Letters" & "Action Plan" Views
*   **Current State:** Text-heavy sections utilizing full-width cards.
*   **Issue:** Reading long blocks of text on mobile requires horizontal eye tracking that can be exhausting if line-heights and margins aren't optimized.
*   **Recommendation:**
    *   **Readability:** Increase `line-height` (leading) to `relaxed` or `loose` for the letter contents. Add sufficient horizontal padding (`px-4` or `px-6`) so text doesn't hug the screen edges.
    *   **Sticky Tabs/Headers:** For the Action Plan (which breaks down into Weeks), make the "Week Selection" tab sticky at the top of the screen as the user scrolls down through the tasks.

## 7. Performance & Loading States
*   **Current State:** AI generation takes time (especially image/video generation).
*   **Issue:** Staring at a static loading spinner on a mobile device for 30+ seconds often makes users think the app has frozen.
*   **Recommendation:** 
    *   Implement **Skeleton Screens**: Show the structure of the upcoming UI with shimmering placeholders instead of generic spinners.
    *   **Step-by-Step Updates:** During long generations, provide dynamic text updates (e.g., "Analyzing medical profile...", "Generating future avatar...", "Calculating physiological changes...").

## 8. Camera & Media Uploads
*   **Current State:** Avatar upload relies on standard file input.
*   **Issue:** Mobile users expect native-feeling camera integration.
*   **Recommendation:** Ensure the `<input type="file" accept="image/*" capture="user" />` attribute is utilized correctly to offer a direct "Take Selfie" option on mobile browsers, streamlining the avatar creation process.
