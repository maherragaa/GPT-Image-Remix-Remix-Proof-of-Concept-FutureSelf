# Image Generation Prompts

This document details the exact prompts constructed internally to generate the predictive physical and anatomical trajectory images used across the application contexts.

The image generation engine uses a dynamic prompting architecture that adjusts based on logical states (`isOptimized`, `simAge`, `diseaseConditions`, etc.).

---

## 1. Standard Pathway ("Now" and "10 Years") 
This pathway represents the "Pathological Forecast". Here, the user's *current* lifestyle choices and conditions remain unmodified, accumulating over the timeframe. `isOptimized` is `false`.

### A. External Full-Body Avatar Generation
The core objective is to visibly render systemic deterioration while anchoring strictly to the individual's baseline identity.

**Core Variables:**
- \`yearsElapsed\`: (e.g., 0 for Now, 10 for 10 Years)
- \`biologicalAge\`: Calculated dynamically. Baseline + penalty for poor diet/smoking, etc.
- \`glogauScale\`: Age-dependent skin degradation index.

**If a reference selfie (`faceImage`) is provided:**

\`\`\`text
The provided reference image is of the user at age {currentAge}. Edit this image to age them by {yearsElapsed} years and show them FULL-BODY at chronological age {simAge} (Biological Age: {biologicalAge}). 

Avatar state: {sim.avatarState}. Lifestyle: {currentDiet} diet, {currentActivity}, Conditions: {diseaseConditions}. Show the physical effects of their lifestyle and conditions. 

You must render a FULL BODY view (standing, front or 45 degree angle) tracking from head to toe. They must be wearing {outfit}. 

CRITICAL MEDICAL REQUIREMENT: You MUST render parts of the skin/body as transparent or "x-ray" style to clearly reveal internal systems, organs, or anatomical structures that have abnormalities, diseases, or damage related to their conditions. If there are visible skin conditions, render them prominently on the visible skin surface. 

Include 3-5 clear text labels pointing to specific areas. 
Include a summary of user info: Chronological Age: {simAge}, Biological Age: {biologicalAge}, Gender: {currentGender}, Height: {currentHeight}cm, Weight: {currentWeight}kg, BMI: {currentBmi}, Diet: {currentDiet}, Activity: {currentActivity}, Smoking: {smokingStatus}, Conditions: {diseaseConditions}. 

CRITICAL AGING CONSTRAINTS: Base the physical appearance strictly on the Biological Age ({biologicalAge}) using the Glogau Wrinkle Scale: {glogauScale}. DO NOT exaggerate aging. Apply subtle, realistic micro-aging. For healthy biological ages, strictly preserve skin elasticity, youthful volume, and natural hair color. Do not add deep wrinkles, sagging, or gray hair unless the biological age is over 50. IMPORTANT CONSTRAINT: If the feet are visible in the image, they MUST be completely bare and exposed barefoot (no shoes, no socks, no footwear).

CRITICAL: MUST maintain the EXACT SAME facial features, ethnicity, base identity, and skin tone as the provided reference image.
CRITICAL: All text labels in the image MUST be written in {language}. Clean white background.
\`\`\`

**If NO reference image is provided (Realistic Avatar Generation):**

\`\`\`text
A highly consistent, hyper-realistic medical-style full body illustration of a {currentGender} individual. Currently chronological age {simAge} (Biological Age: {biologicalAge}), {currentHeight}cm tall, weighing {currentWeight}kg (BMI: {currentBmi}). Lifestyle: {currentDiet} diet, {currentActivity}, Conditions: {diseaseConditions}. Avatar state: {sim.avatarState}. Show the physical effects of their lifestyle and conditions. MUST be in a standing, flat-arms position, wearing {outfit}. 

CRITICAL MEDICAL REQUIREMENT: You MUST render parts of the skin/body as transparent or "x-ray" style to clearly reveal internal systems, organs, or anatomical structures that have abnormalities, diseases, or damage related to their conditions. If there are visible skin conditions, render them prominently on the visible skin surface. 

Include 3-5 clear text labels pointing to specific areas to help a novice user understand the conditions or abnormalities shown. Include a summary of user info: [User Summary]. [Clinical Constraints]. CRITICAL: All text labels in the image MUST be written in {language}. Clean white background.
\`\`\`

### B. Internal Organ Generation (Arteries)
Provides a microscopic visualization of the circulatory system.

**Initial Generation ("Now"):**
\`\`\`text
A highly consistent, hyper-realistic medical cross-section illustration of a human artery. Health score: {sim.arteryHealth}/100. Plaque/blood flow: {sim.explanation}. Include 3-5 clear text labels in {language} pointing to specific areas to help a novice user understand the conditions or abnormalities shown. Clean white background.
\`\`\`

**Progression Generation ("10 Years" using prior frame as reference):**
\`\`\`text
The provided reference image is from 10 years ago. Edit this image to show the progression over 10 years. Reflect a health score of {sim.arteryHealth}/100. Plaque/blood flow: {sim.explanation}. Include 3-5 clear text labels in {language} pointing to specific areas to help a novice user understand the conditions or abnormalities shown. MUST maintain the exact same cross-section angle, lighting, illustration style, and zoom level. Clean white background.
\`\`\`

---

## 2. Optimized Pathway ("Take Control of Your Future")

This pathway simulates a highly disciplined adherence to health interventions over the same 10-year period. In code, the application manually overwrites the user's negative variables before pushing them through the exact same prompt template architecture.

**Variable Overrides prior to synthesis:**
- \`isOptimized\`: `true`
- \`weight\`: `startWeight * 0.9` (Simulates a 10% healthy weight reduction)
- \`diet\`: `"Excellent"`
- \`activityLevel\`: `"Active"`
- \`smokingStatus\`: Forcibly rendered as `"Never"` in the user summary.
- \`biologicalAge\`: System deducts `-4` years from the chronological timeline immediately to signify cellular repair.

### Final Synthesized Prompt Context (Example for Body)
Because the template remains the same, the output drastically alters because the *context* strings injected into it are deeply optimistic. 

\`\`\`text
...
Lifestyle: Excellent diet, Active, Conditions: None. Show the physical effects of their lifestyle and conditions.
...
Include a summary of user info: Chronological Age: {age + 10}, Biological Age: {age + 10 - 4}, Gender: {currentGender}, Height: {height}cm, Weight: {weight * 0.9}kg, BMI: {newBmi}, Diet: Excellent, Activity: Active, Smoking: Never, Conditions: None.
...
\`\`\`

The resulting generated images systematically strip away the pathological x-ray nodes, plaque build-ups, and rapid aging markers, producing a clean, healthy, vibrant counterpart image that perfectly aligns with the exact pose or cross-section of the unoptimized outcome—facilitating the slider-based UI comparisons.
