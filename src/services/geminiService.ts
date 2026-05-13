import { GoogleGenAI, Type, Modality } from "@google/genai";
import OpenAI from "openai";

function getWavDataUrl(base64Pcm: string, sampleRate: number = 24000): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const binaryString = atob(base64Pcm);
      const pcmData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        pcmData[i] = binaryString.charCodeAt(i);
      }

      const numChannels = 1;
      const bitsPerSample = 16;
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const blockAlign = numChannels * (bitsPerSample / 8);

      const buffer = new ArrayBuffer(44 + pcmData.length);
      const view = new DataView(buffer);

      function writeString(v: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
          v.setUint8(offset + i, string.charCodeAt(i));
        }
      }

      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + pcmData.length, true);
      writeString(view, 8, 'WAVE');

      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, byteRate, true);
      view.setUint16(32, blockAlign, true);
      view.setUint16(34, bitsPerSample, true);

      writeString(view, 36, 'data');
      view.setUint32(40, pcmData.length, true);

      const pcmView = new Uint8Array(buffer, 44);
      pcmView.set(pcmData);

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    } catch (e) {
      reject(e);
    }
  });
}

export async function generateSpeech(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO], 
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return await getWavDataUrl(base64Audio, 24000);
    }
  } catch (err) {
    console.error("Error generating speech", err);
  }
  return null;
}

export interface HealthSimulation {
  timeframe: string;
  holisticHealthScore: number; // 0-100 (100 is best)
  biologicalAge: number; // Absolute estimated biological age
  heartStress: number; // 0-100
  arteryHealth: number; // 0-100 (100 is best)
  overallRisk: number; // 0-100
  mentalWellbeing: number; // 0-100
  cognitiveFunction: number; // 0-100
  inflammationLevel: number; // 0-100 (0 is best)
  cellularAging: number; // 0-100 (0 is best)
  insulinResistance: number; // 0-100 (0 is best)
  metricComments?: {
    holisticHealthScore: string;
    biologicalAge: string;
    heartStress: string;
    arteryHealth: string;
    overallRisk: string;
    mentalWellbeing: string;
    cognitiveFunction: string;
    inflammationLevel: string;
    cellularAging: string;
    insulinResistance: string;
  };
  explanation: string;
  psychologicalState: string;
  avatarState: "healthy" | "slightly-aged" | "aged" | "unhealthy";
  heartColor: string; // hex color
  arteryColor: string; // hex color
}

const compressImageHelper = (dataUrl: string, maxWidth: number, maxHeight: number, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        reject('Could not get canvas context');
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

export async function generateHealthImage(prompt: string, referenceImage?: string, retries = 2): Promise<string | null> {
  let apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
  try {
    if (!apiKey) {
      // Vite statically replaces `process.env.OPENAI_API_KEY` during build/dev
      apiKey = process.env.OPENAI_API_KEY;
    }
  } catch (e) {
    // safely ignore
  }

  if (!apiKey) {
    console.warn("No OpenAI API key found for image generation. Add OPENAI_API_KEY to your env variables.");
    return null;
  }

  console.log("Generating image with OpenAI responses module...");
  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true, maxRetries: retries });

  let promptContent: any = [
    { type: "input_text", text: prompt }
  ];
  if (referenceImage) {
    if (referenceImage.startsWith('http') || referenceImage.startsWith('data:image')) {
      promptContent = [
        { type: "input_text", text: prompt },
        { type: "input_image", image_url: referenceImage }
      ];
    }
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "user",
          content: promptContent
        }
      ],
      text: {
        "format": {
          "type": "text"
        },
        "verbosity": "low"
      },
      reasoning: {
        "effort": "low"
      },
      tools: [
        {
          "type": "image_generation",
          "model": "gpt-image-2",
          "size": "1024x1024",
          "quality": "medium",
          "output_format": "png",
          "background": "auto",
          "moderation": "low",
          "partial_images": 0
        } as any
      ],
      store: true,
      include: [
        "reasoning.encrypted_content",
        "web_search_call.action.sources"
      ]
    } as any);

    // Parse the response to find the generated image
    let imageUrl = null;
    let b64 = null;
    
    // Look for image data in the response tree
    const findImage = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (obj.startsWith('data:image/') || obj.startsWith('http')) {
          imageUrl = obj;
        } else if (obj.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
          b64 = obj;
        }
        return;
      }
      if (typeof obj === 'object') {
        if (obj.url) imageUrl = obj.url;
        if (obj.b64_json) b64 = obj.b64_json;
        if (obj.base64) b64 = obj.base64;
        if (imageUrl || b64) return;
        Object.values(obj).forEach(findImage);
      }
    };
    findImage(response);

    let rawUrl = imageUrl;
    if (b64 && !rawUrl) {
      rawUrl = `data:image/png;base64,${b64}`;
    }

    if (rawUrl) {
      try {
        if (rawUrl.startsWith('data:')) {
          return await compressImageHelper(rawUrl, 1024, 1024, 0.85);
        }
        return rawUrl;
      } catch (e) {
        return rawUrl;
      }
    }
    
    // Fallback if the user's gpt-5.4-mini guidance endpoint didn't output an image structure we expect,
    // let's just make a standard dall-e-3 call safely inside the same function.
    console.warn("Could not find image output in gpt-5.4-mini structure, falling back to dall-e-3...");
    const fallbackResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.substring(0, 3999),
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });
    
    if (fallbackResponse && fallbackResponse.data && fallbackResponse.data.length > 0 && fallbackResponse.data[0].b64_json) {
       const fallbackRwUrl = `data:image/png;base64,${fallbackResponse.data[0].b64_json}`;
       try {
          return await compressImageHelper(fallbackRwUrl, 1024, 1024, 0.85);
       } catch (e) {
          return fallbackRwUrl;
       }
    }

    return null;
  } catch (error) {
    console.error("OpenAI image generation failed:", error);
    return null;
  }
}

export async function generateFutureAlbumImages(prompt: string, referenceImage?: string, retries = 2): Promise<string[]> {
  let apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
  try {
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY;
    }
  } catch (e) { }

  if (!apiKey) {
    console.warn("No OpenAI API key found for image generation.");
    return [];
  }

  const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true, maxRetries: retries });

  let promptContent: any = [
    { type: "input_text", text: prompt + "\n\nCRITICAL INSTRUCTION: You MUST call the image_generation tool EXACTLY 3 times to generate 3 separate images in different nice settings." }
  ];
  if (referenceImage) {
    if (referenceImage.startsWith('http') || referenceImage.startsWith('data:image')) {
      promptContent = [
        { type: "input_text", text: prompt + "\n\nCRITICAL INSTRUCTION: You MUST call the image_generation tool EXACTLY 3 times to generate 3 separate images in different nice settings." },
        { type: "input_image", image_url: referenceImage }
      ];
    }
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "user",
          content: promptContent
        }
      ],
      text: { "format": { "type": "text" }, "verbosity": "low" },
      reasoning: { "effort": "low" },
      tools: [
        {
          "type": "image_generation",
          "model": "gpt-image-2",
          "size": "1024x1024",
          "quality": "medium",
          "output_format": "png",
          "background": "auto",
          "moderation": "low",
          "partial_images": 0
        } as any
      ],
      store: true,
      include: ["reasoning.encrypted_content", "web_search_call.action.sources"]
    } as any);

    let imageUrls: string[] = [];
    const findImages = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'string') {
        if (obj.startsWith('data:image/') || obj.startsWith('http')) {
          if (!imageUrls.includes(obj)) imageUrls.push(obj);
        } else if (obj.length > 1000 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
          const rawUrl = `data:image/png;base64,${obj}`;
          if (!imageUrls.includes(rawUrl)) imageUrls.push(rawUrl);
        }
        return;
      }
      if (typeof obj === 'object') {
        if (obj.url && !imageUrls.includes(obj.url)) imageUrls.push(obj.url);
        if (obj.b64_json) {
          const rawUrl = `data:image/png;base64,${obj.b64_json}`;
          if (!imageUrls.includes(rawUrl)) imageUrls.push(rawUrl);
        }
        if (obj.base64) {
          const rawUrl = `data:image/png;base64,${obj.base64}`;
          if (!imageUrls.includes(rawUrl)) imageUrls.push(rawUrl);
        }
        Object.values(obj).forEach(findImages);
      }
    };
    findImages(response);

    const compressedUrls = await Promise.all(imageUrls.map(async (rawUrl) => {
      try {
        if (rawUrl.startsWith('data:')) {
           return await compressImageHelper(rawUrl, 1024, 1024, 0.85);
        }
        return rawUrl;
      } catch (e) {
        return rawUrl;
      }
    }));

    if (compressedUrls.length > 0) return compressedUrls;

    const fallbackResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt.substring(0, 3999),
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    });
    
    if (fallbackResponse && fallbackResponse.data && fallbackResponse.data.length > 0 && fallbackResponse.data[0].b64_json) {
       const fallbackRwUrl = `data:image/png;base64,${fallbackResponse.data[0].b64_json}`;
       try {
          const comp = await compressImageHelper(fallbackRwUrl, 1024, 1024, 0.85);
          return [comp];
       } catch (e) {
          return [fallbackRwUrl];
       }
    }
    return [];

  } catch (error) {
    console.error("OpenAI image album generation failed:", error);
    return [];
  }
}

export async function generateActionPlan(
  age: number,
  gender: string,
  height: number,
  weight: number,
  bmi: string,
  activityLevel: string,
  diet: string,
  smokingStatus: string,
  diseaseConditions: string,
  stressLevel: string,
  sleepQuality: string,
  historicalLogsContext: string = "",
  biomarkersText: string | undefined,
  language: string = "English"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `
    You are a preventative cardiologist, psychiatrist, and holistic health expert. A patient is requesting an action plan and a clinical enablement report.
    
    PATIENT BASELINE PROFILE:
    Age: ${age}, Gender: ${gender}, Height: ${height}cm, Weight: ${weight}kg, BMI: ${bmi}
    Activity Level: ${activityLevel}, Diet: ${diet}, Smoking Status: ${smokingStatus}
    Conditions: ${diseaseConditions || 'None'}
    Stress Level: ${stressLevel}, Sleep Quality: ${sleepQuality}
    ${biomarkersText ? `Clinical Biomarkers: ${biomarkersText}\n` : ''}
    
    RECENT CLINICAL/LOGGING CONTEXT (FOOD & MOOD TRACKING):
    ${historicalLogsContext || 'No recent food or mood tracking data available yet.'}

    You must output a Markdown document with TWO distinct sections.
    
    SECTION 1: CLINICAL HOLISTIC REPORT & FORECAST
    Write this section directly for a primary care doctor or specialist. Use professional medical terminology. 
    Analyze the patient's baseline variables combined with their recent food/mood logging data to provide:
    - Holistic Summary: How their diet, stress, and sleep are impacting them.
    - Pathological Forecast: Predict potential downstream risks (e.g., metabolic syndrome, severe burnout, cardiovascular drift) over the next 1-5 years based on current data trends.
    - Clinical Enablement: What the doctor should screen for next or prioritize in their care.
    Use the exact heading: "## Clinical Holistic Report & Forecast"

    SECTION 2: 30-DAY PATIENT ACTION PLAN
    Write this section directly to the patient. Focus on the easiest, highest-impact changes they can make to reduce their risks and improve their psychological/cognitive state.
    Format the response with weekly headings (e.g., "## Week 1: Baseline Stabilization"). Use bullet points for daily actions, and an encouraging tone.

    CRITICAL INSTRUCTION: You MUST output all text in ${language}. Do not include disclaimers.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite', // Switch to flash-lite as requested by user
      contents: prompt,
    });
    return response.text || "Could not generate action plan.";
  } catch (error) {
    console.error("Action plan generation failed", error);
    return "Failed to generate action plan. Please try again.";
  }
}

export async function generateAdvisorWelcome(
  userContextSummary: string,
  language: string = "English"
): Promise<{ text: string; suggestions: string[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are a world-class holistic health and wellbeing advisor.
  
Core Mission:
Act as a supportive, empathetic, and evidence-based Personal Wellbeing Advisor utilizing CBT and DBT frameworks. You also act as a clinical enabler, bridging the gap between the patient's daily habits and the 'Clinical Holistic Report & Forecast'.

CRITICAL INSTRUCTIONS:
1. Generate a brief, warm welcome message (1-2 very short sentences).
2. Offer exactly 3 to 5 actionable suggestions for what we can focus on today, based on my health context. The suggestions MUST be actions or topics that YOU, the AI advisor, can actually perform or assist with (e.g., "Analyze my recent mood log", "Guide me through a DBT grounding exercise", "Explain how my diet affects my brain", "Review my Clinical Report").
3. You MUST converse entirely in ${language}.
4. Return ONLY a JSON object with this exact structure (no markdown wrapper):
{
  "text": "Your welcoming markdown text here.",
  "suggestions": ["Actionable AI Suggestion 1", "Actionable AI Suggestion 2", "Actionable AI Suggestion 3"]
}

USER DATA/CONTEXT:
${userContextSummary}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             text: { type: Type.STRING },
             suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["text", "suggestions"]
        }
      }
    });

    if (response.text) {
      try {
        const parsed = JSON.parse(response.text);
        return {
          text: parsed.text || "Hi! I'm here to help you improve your wellbeing today.",
          suggestions: parsed.suggestions || []
        };
      } catch (e) {
        return { text: response.text, suggestions: [] };
      }
    }
  } catch (e) {
    console.error("Welcome generation error", e);
  }
  return { 
    text: "Hi! I'm fully aware of your health profile. How can I help you improve your wellbeing today?", 
    suggestions: [] 
  };
}

export async function sendAdvisorChatMessage(
  message: string,
  history: { role: 'user' | 'model', parts: any[] }[],
  userContextSummary: string,
  faceImage?: string | null,
  generatedImages?: Record<string, any>,
  language: string = "English"
): Promise<{ text: string; suggestions: string[] }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const systemInstruction = `You are a world-class holistic health and wellbeing advisor. You are helping a user with their personal health journey. You hold deep context of their current stats, food/mood logs, simulated future health, and their latest "Clinical Holistic Report & Forecast" outlining potential risks.
  
Core Mission:
To act as a supportive, empathetic, and evidence-based Personal Wellbeing Advisor. You also act as a bridging tool connecting the patient's daily habits to the trajectory outlined in their Clinical Report, preparing them for consultations with their doctor. You help the user navigate daily stressors using Cognitive Behavioral Therapy (CBT) and Dialectical Behavior Therapy (DBT).

Operational Guidelines
• The CBT Approach (Cognitive Restructuring):
• Help the user identify "cognitive distortions" (e.g., all-or-nothing thinking, catastrophizing).
• Guide the user through Socratic questioning to test the validity of their thoughts.
• Encourage the development of balanced, alternative perspectives.
• The DBT Approach (Skill Building):
• Mindfulness: Remind the user to stay present and observe their emotions without judgment.
• Distress Tolerance: Provide "TIPP" skills or grounding exercises during high stress/crisis.
• Emotion Regulation: Help the user label emotions and understand their function.
• Clinical Enablement & Tracking:
• Actively reference their recent food and mood logs to help them find correlations between their habits and somatic states.
• Point out insights directly connected to their Clinical Holistic Forecast to help the user understand what they should highlight to their primary care physician.
• Tone and Style:
• Validating yet Objective: Acknowledge the user's feelings first (DBT validation) before moving into problem-solving.
• Collaborative: Use "we" and "us" to foster a partnership.
• Non-Prescriptive: Offer tools and suggestions rather than "orders."
* Always start by offering help based on the objective set to you and the context.
  
CRITICAL INSTRUCTIONS:
1. Keep your answers SHORT and concise unless a deeper explanation is strictly necessary.
2. Format your responses to maximize readability (use very short paragraphs, bullet points, and **bold text** for emphasis).
3. Use emojis naturally and frequently to keep the tone friendly, encouraging, and visually engaging! 🌟
4. When you generate an image, DO NOT try to output Markdown for it yourself. The system will automatically attach the image to your response.
5. EXTREMELY CRITICAL: You MUST converse entirely in ${language}. All of your output text must be in ${language}.
6. You MUST return your response as a JSON object matching this schema exactly: { "text": "your regular markdown response here", "suggestions": ["Actionable option 1", "Actionable option 2", "Actionable option 3"] }
7. Provide 3-5 brief, actionable suggestions as quick replies for the user. These MUST be follow-up actions or topics that YOU, the AI advisor, can actually perform or assist with right here in the chat (e.g., "Help me challenge this anxious thought", "Explain my heart health risk", "Guide me through a 2-minute breathing exercise"). Do NOT suggest UI actions you cannot perform (like "click the settings button").

Be highly personalized, encouraging, and evidence-based. Address the user directly. Reference their specific data when appropriate to provide targeted, actionable advice.

USER DATA/CONTEXT:
${userContextSummary}`;

  // Assemble contextual image parts for the initial context
  const contextImageParts: any[] = [];
  
  if (faceImage) {
    const match = faceImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      contextImageParts.push({ text: "User's original face/body photo:" });
      contextImageParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
    }
  }

  if (generatedImages && Object.keys(generatedImages).length > 0) {
    contextImageParts.push({ text: "Previously generated simulation images for the user across different years:" });
    for (const [timeframe, urlsObj] of Object.entries(generatedImages)) {
      contextImageParts.push({ text: `Images for timeframe: ${timeframe}` });
      for (const [organ, url] of Object.entries(urlsObj as Record<string, string>)) {
         if (url && typeof url === 'string') {
            const match = url.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (match) {
              contextImageParts.push({ text: `Organ/View: ${organ}` });
              contextImageParts.push({ inlineData: { mimeType: match[1], data: match[2] } });
            }
         }
      }
    }
  }

  const enhancedHistory = [...history];
  let fullContents: any[] = [];
  if (contextImageParts.length > 0) {
     fullContents.push({
       role: 'user',
       parts: [
         { text: "Here is my private visual context for you to analyze my health and progression:" },
         ...contextImageParts,
         { text: "Acknowledge these internally and answer my next questions based on this." }
       ]
     });
     fullContents.push({ role: 'model', parts: [{ text: JSON.stringify({text: "I have received your visual health logs and will use them to provide personalized advice.", suggestions: []}) }] });
  }
  fullContents = fullContents.concat(enhancedHistory);
  fullContents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: fullContents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      }
    });

    let returnText = "I'm sorry, I couldn't process that right now.";
    let suggestions: string[] = [];

    if (response.text) {
       try {
          const parsed = JSON.parse(response.text);
          returnText = parsed.text || response.text;
          suggestions = parsed.suggestions || [];
       } catch (e) {
          returnText = response.text;
       }
    }
    
    return { text: returnText, suggestions };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "I am currently experiencing connectivity issues. Please try again later.", suggestions: [] };
  }
}

export async function generateCombinedHealthSimulation(
  age: number,
  gender: string,
  height: number,
  weight: number,
  bmi: string,
  activityLevel: string,
  diet: string,
  smokingStatus: string,
  diseaseConditions: string,
  stressLevel: string,
  sleepQuality: string,
  foodLogsSummary?: string,
  moodLogsSummary?: string,
  biomarkersText?: string,
  language: string = "English"
): Promise<{ current: HealthSimulation[], optimized: HealthSimulation[] }> {
  
  const optimizedWeight = parseFloat(bmi) > 25 ? weight * 0.9 : weight;
  const optimizedBmi = (optimizedWeight / Math.pow(height / 100, 2)).toFixed(1);

  const prompt = `
    You are a medical education AI. You must simulate TWO parallel cardiovascular and cognitive health trajectories over 2 timeframes: "Now" and "10 Years".
    
    1. CURRENT TRAJECTORY Profile:
    Age: ${age}, Gender: ${gender}, Height: ${height}cm, Weight: ${weight}kg, BMI: ${bmi}
    Activity: ${activityLevel}, Diet: ${diet}, Smoking: ${smokingStatus}
    Current Conditions: ${diseaseConditions || 'None'}
    Reported Stress Level: ${stressLevel}, Reported Sleep Quality: ${sleepQuality}
    ${biomarkersText ? `\nClinical Biomarkers: ${biomarkersText}` : ''}
    ${foodLogsSummary ? `\nRecent Diet Analysis: ${foodLogsSummary}` : ''}
    ${moodLogsSummary ? `\nRecent Mood Analysis: ${moodLogsSummary}` : ''}
    
    2. OPTIMIZED TRAJECTORY Profile (Perfect Habits):
    Weight: ${optimizedWeight.toFixed(1)}kg, BMI: ${optimizedBmi}
    Activity: Active, Diet: Excellent, Smoking: Never
    Current Conditions: ${diseaseConditions || 'None'}, Stress Level: Low, Sleep Quality: Excellent
    Recent Diet Analysis: User perfectly optimized their food intake log to a 95/100.
    Recent Mood Analysis: User perfectly optimized their mood and sleep to optimal levels.
    
    Respond in ${language}. Ensure the outputs inside the JSON structure are translated to ${language} except for the keys which must remain exactly as defined in the Schema.
    
    For each timeframe in both trajectories, provide:
    - timeframe: The timeframe string ("Now", "10 Years"). DO NOT translate these exact keys.
    - holisticHealthScore: A score from 0 to 100
    - biologicalAge: An estimated biological age in absolute years
    - heartStress: A score from 0 to 100 indicating stress on the heart (higher is worse)
    - arteryHealth: A score from 0 to 100 indicating the health of arteries (100 is best)
    - overallRisk: A percentage from 0 to 100 indicating overall cardiovascular risk
    - mentalWellbeing: A score from 0 to 100 indicating emotional stability
    - cognitiveFunction: A score from 0 to 100 indicating brain health
    - inflammationLevel: A score from 0 to 100 indicating systemic inflammation
    - cellularAging: A score from 0 to 100 indicating cellular aging rate
    - insulinResistance: A score from 0 to 100 indicating metabolic health
    - metricComments: An object where EACH key is the EXACT metric name (like holisticHealthScore, biologicalAge, heartStress, arteryHealth, overallRisk, mentalWellbeing, cognitiveFunction, inflammationLevel, cellularAging, insulinResistance) and its value is ONE sentence explaining that specific metric. Format for EACH metric: "Normal: [Range]. Reason: [Why]. Action: [What to do]."
    - explanation: A short explanation (2-3 sentences) in ${language} of the physical internal condition.
    - psychologicalState: A short explanation (1-2 sentences) in ${language}.
    - avatarState: "healthy", "slightly-aged", "aged", or "unhealthy".
    - heartColor: hex color (e.g., #ef4444).
    - arteryColor: hex color (e.g., #ef4444).
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            current: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING },
                  holisticHealthScore: { type: Type.NUMBER },
                  biologicalAge: { type: Type.NUMBER },
                  heartStress: { type: Type.NUMBER },
                  arteryHealth: { type: Type.NUMBER },
                  overallRisk: { type: Type.NUMBER },
                  mentalWellbeing: { type: Type.NUMBER },
                  cognitiveFunction: { type: Type.NUMBER },
                  inflammationLevel: { type: Type.NUMBER },
                  cellularAging: { type: Type.NUMBER },
                  insulinResistance: { type: Type.NUMBER },
                  metricComments: {
                     type: Type.OBJECT,
                     properties: {
                        holisticHealthScore: { type: Type.STRING },
                        biologicalAge: { type: Type.STRING },
                        heartStress: { type: Type.STRING },
                        arteryHealth: { type: Type.STRING },
                        overallRisk: { type: Type.STRING },
                        mentalWellbeing: { type: Type.STRING },
                        cognitiveFunction: { type: Type.STRING },
                        inflammationLevel: { type: Type.STRING },
                        cellularAging: { type: Type.STRING },
                        insulinResistance: { type: Type.STRING }
                     },
                     required: ["holisticHealthScore", "biologicalAge", "heartStress", "arteryHealth", "overallRisk", "mentalWellbeing", "cognitiveFunction", "inflammationLevel", "cellularAging", "insulinResistance"]
                  },
                  explanation: { type: Type.STRING },
                  psychologicalState: { type: Type.STRING },
                  avatarState: { type: Type.STRING },
                  heartColor: { type: Type.STRING },
                  arteryColor: { type: Type.STRING },
                },
                required: ["timeframe", "holisticHealthScore", "biologicalAge", "heartStress", "arteryHealth", "overallRisk", "mentalWellbeing", "cognitiveFunction", "inflammationLevel", "cellularAging", "insulinResistance", "metricComments", "explanation", "psychologicalState", "avatarState", "heartColor", "arteryColor"]
              }
            },
            optimized: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeframe: { type: Type.STRING },
                  holisticHealthScore: { type: Type.NUMBER },
                  biologicalAge: { type: Type.NUMBER },
                  heartStress: { type: Type.NUMBER },
                  arteryHealth: { type: Type.NUMBER },
                  overallRisk: { type: Type.NUMBER },
                  mentalWellbeing: { type: Type.NUMBER },
                  cognitiveFunction: { type: Type.NUMBER },
                  inflammationLevel: { type: Type.NUMBER },
                  cellularAging: { type: Type.NUMBER },
                  insulinResistance: { type: Type.NUMBER },
                  metricComments: {
                     type: Type.OBJECT,
                     properties: {
                        holisticHealthScore: { type: Type.STRING },
                        biologicalAge: { type: Type.STRING },
                        heartStress: { type: Type.STRING },
                        arteryHealth: { type: Type.STRING },
                        overallRisk: { type: Type.STRING },
                        mentalWellbeing: { type: Type.STRING },
                        cognitiveFunction: { type: Type.STRING },
                        inflammationLevel: { type: Type.STRING },
                        cellularAging: { type: Type.STRING },
                        insulinResistance: { type: Type.STRING }
                     },
                     required: ["holisticHealthScore", "biologicalAge", "heartStress", "arteryHealth", "overallRisk", "mentalWellbeing", "cognitiveFunction", "inflammationLevel", "cellularAging", "insulinResistance"]
                  },
                  explanation: { type: Type.STRING },
                  psychologicalState: { type: Type.STRING },
                  avatarState: { type: Type.STRING },
                  heartColor: { type: Type.STRING },
                  arteryColor: { type: Type.STRING },
                },
                required: ["timeframe", "holisticHealthScore", "biologicalAge", "heartStress", "arteryHealth", "overallRisk", "mentalWellbeing", "cognitiveFunction", "inflammationLevel", "cellularAging", "insulinResistance", "metricComments", "explanation", "psychologicalState", "avatarState", "heartColor", "arteryColor"]
              }
            }
          },
          required: ["current", "optimized"]
        }
      },
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr) as { current: HealthSimulation[], optimized: HealthSimulation[] };
    }
    return { current: [], optimized: [] };
  } catch (error) {
    console.error("Error generating combined simulation:", error);
    throw error;
  }
}

export async function generateHealthSimulation(
  age: number,
  gender: string,
  height: number,
  weight: number,
  bmi: string,
  activityLevel: string,
  diet: string,
  smokingStatus: string,
  diseaseConditions: string,
  stressLevel: string,
  sleepQuality: string,
  foodLogsSummary?: string,
  moodLogsSummary?: string,
  biomarkersText?: string,
  language: string = "English"
): Promise<HealthSimulation[]> {
  const prompt = `
    You are a medical education AI. Based on the following user profile, simulate their cardiovascular and cognitive health over 2 timeframes: "Now" and "10 Years".
    
    User Profile:
    Age: ${age}, Gender: ${gender}, Height: ${height}cm, Weight: ${weight}kg, BMI: ${bmi}
    Activity: ${activityLevel}, Diet: ${diet}, Smoking: ${smokingStatus}
    Current Conditions: ${diseaseConditions || 'None'}
    Reported Stress Level: ${stressLevel}, Reported Sleep Quality: ${sleepQuality}
    ${biomarkersText ? `\nClinical Biomarkers: ${biomarkersText}` : ''}
    ${foodLogsSummary ? `\nRecent Diet Analysis: ${foodLogsSummary}` : ''}
    ${moodLogsSummary ? `\nRecent Mood Analysis: ${moodLogsSummary}` : ''}
    
    Respond in ${language}. Ensure the outputs inside the JSON structure are translated to ${language} except for the keys which must remain exactly as defined in the Schema.
    
    Predict the trajectory. If they have poor habits (smoking, sedentary, poor diet, high stress), metrics should decline faster. If habits are excellent, they should maintain health. Provide realistic, scientifically grounded estimates.

    For each timeframe, provide:
    - timeframe: The timeframe string ("Now", "10 Years"). DO NOT translate these exact keys.
    - holisticHealthScore: A score from 0 to 100 capturing overall vitality and healthspan (100 is best).
    - biologicalAge: An estimated biological age in absolute years (can be higher or lower than chronological age).
    - heartStress: A score from 0 to 100 indicating stress on the heart (higher is worse).
    - arteryHealth: A score from 0 to 100 indicating the health of arteries (100 is best, lower means plaque buildup/stiffness).
    - overallRisk: A percentage from 0 to 100 indicating overall cardiovascular risk.
    - mentalWellbeing: A score from 0 to 100 indicating emotional stability, happiness, and resilience (100 is best).
    - cognitiveFunction: A score from 0 to 100 indicating memory, focus, and brain health (100 is best).
    - inflammationLevel: A score from 0 to 100 indicating systemic inflammation in the body (0 is best, lower is better).
    - cellularAging: A score from 0 to 100 indicating the rate of cellular aging/biological clock (0 is best, lower is better).
    - insulinResistance: A score from 0 to 100 indicating metabolic health and insulin sensitivity (0 is best, lower is better).
    - metricComments: An object where EACH key is the EXACT metric name (like holisticHealthScore, biologicalAge, heartStress, arteryHealth, overallRisk, mentalWellbeing, cognitiveFunction, inflammationLevel, cellularAging, insulinResistance) and its value is ONE sentence explaining that specific metric. Format for EACH metric: "Normal: [Range]. Reason: [Why]. Action: [What to do]." CRITICAL: The sentence MUST be in ${language}.
    - explanation: A short, engaging, non-clinical explanation (2-3 sentences) in ${language} of what is happening inside their body (heart and arteries) based on their lifestyle choices.
    - psychologicalState: A short explanation (1-2 sentences) in ${language} of their brain health, stress impact, and cognitive state.
    - avatarState: A string representing their external appearance. Choose from: "healthy", "slightly-aged", "aged", "unhealthy".
    - heartColor: A hex color representing the heart's health (e.g., #ef4444 for healthy red, #b91c1c for stressed dark red, #fca5a5 for weak).
    - arteryColor: A hex color representing artery health (e.g., #ef4444 for clear red, #fef08a for slight plaque, #eab308 for heavy plaque).

    Ensure the progression makes logical sense based on the lifestyle inputs. If they have unhealthy habits (smoking, poor diet, low activity, high stress, poor sleep), the metrics should worsen over time. If they have healthy habits, the metrics should remain stable or improve slightly.
    
    IMPORTANT: You must output ONLY a raw JSON Array of objects. Do not include markdown codeblocks or any wrapping text.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timeframe: { type: Type.STRING },
              holisticHealthScore: { type: Type.NUMBER },
              biologicalAge: { type: Type.NUMBER },
              heartStress: { type: Type.NUMBER },
              arteryHealth: { type: Type.NUMBER },
              overallRisk: { type: Type.NUMBER },
              mentalWellbeing: { type: Type.NUMBER },
              cognitiveFunction: { type: Type.NUMBER },
              inflammationLevel: { type: Type.NUMBER },
              cellularAging: { type: Type.NUMBER },
              insulinResistance: { type: Type.NUMBER },
              metricComments: {
                 type: Type.OBJECT,
                 properties: {
                    holisticHealthScore: { type: Type.STRING },
                    biologicalAge: { type: Type.STRING },
                    heartStress: { type: Type.STRING },
                    arteryHealth: { type: Type.STRING },
                    overallRisk: { type: Type.STRING },
                    mentalWellbeing: { type: Type.STRING },
                    cognitiveFunction: { type: Type.STRING },
                    inflammationLevel: { type: Type.STRING },
                    cellularAging: { type: Type.STRING },
                    insulinResistance: { type: Type.STRING }
                 },
                 required: ["holisticHealthScore", "biologicalAge", "heartStress", "arteryHealth", "overallRisk", "mentalWellbeing", "cognitiveFunction", "inflammationLevel", "cellularAging", "insulinResistance"]
              },
              explanation: { type: Type.STRING },
              psychologicalState: { type: Type.STRING },
              avatarState: { type: Type.STRING },
              heartColor: { type: Type.STRING },
              arteryColor: { type: Type.STRING },
            },
            required: ["timeframe", "holisticHealthScore", "biologicalAge", "heartStress", "arteryHealth", "overallRisk", "mentalWellbeing", "cognitiveFunction", "inflammationLevel", "cellularAging", "insulinResistance", "metricComments", "explanation", "psychologicalState", "avatarState", "heartColor", "arteryColor"]
          }
        }
      },
    });

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr) as HealthSimulation[];
    }
    return [];
  } catch (error) {
    console.error("Error generating simulation:", error);
    throw error;
  }
}

export async function generateVeoVideo(prompt: string, referenceImage?: string, endImage?: string, aspectRatio: string = '16:9'): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  let resolvedReferenceImage = referenceImage;
  if (resolvedReferenceImage && resolvedReferenceImage.startsWith('http')) {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(resolvedReferenceImage)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      resolvedReferenceImage = await new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result as string);
         reader.onerror = reject;
         reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Cross-origin or fetch error on referenceImage", e);
    }
  }

  let resolvedEndImage = endImage;
  if (resolvedEndImage && resolvedEndImage.startsWith('http')) {
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(resolvedEndImage)}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      resolvedEndImage = await new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = () => resolve(reader.result as string);
         reader.onerror = reject;
         reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Cross-origin or fetch error on endImage", e);
    }
  }

  try {
    const apiOptions: any = {
      model: 'veo-3.1-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
        includeAudio: true,
      }
    };
    
    if (resolvedReferenceImage) {
      let mimeType = 'image/jpeg';
      let dataStr = resolvedReferenceImage;
      if (resolvedReferenceImage.startsWith('data:')) {
         const parts = resolvedReferenceImage.split(',');
         mimeType = parts[0].split(':')[1].split(';')[0];
         dataStr = parts[1];
      }
      apiOptions.image = {
        imageBytes: dataStr,
        mimeType
      };
    }

    if (resolvedEndImage) {
      let mimeType = 'image/jpeg';
      let dataStr = resolvedEndImage;
      if (resolvedEndImage.startsWith('data:')) {
         const parts = resolvedEndImage.split(',');
         mimeType = parts[0].split(':')[1].split(';')[0];
         dataStr = parts[1];
      }
      apiOptions.config.lastFrame = {
        imageBytes: dataStr,
        mimeType
      };
    }
  
    let operation = await ai.models.generateVideos(apiOptions);
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }
    
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;
    
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
         'x-goog-api-key': process.env.GEMINI_API_KEY || ''
      }
    });
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error generating video", error);
    return null;
  }
}

export async function analyzeBiomarkerLog(
  profile: any,
  logData: {
    totalCholesterol?: number | null;
    ldl?: number | null;
    hdl?: number | null;
    lpa?: number | null;
    randomGlucose?: number | null;
    hba1c?: number | null;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
  },
  language: 'en' | 'ar'
): Promise<{ overallStatus: string; criticalAlerts?: string[]; improvements?: string[] } | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const schema = {
    type: Type.OBJECT,
    properties: {
      overallStatus: { type: Type.STRING, description: "A comprehensive summary of these specific lab results." },
      criticalAlerts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any immediate health risks based on out-of-range values." },
      improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Short-term actionable suggestions to improve these specific biomarkers." }
    },
    required: ["overallStatus"]
  };

  const prompt = `
    Analyze the following recent biomarker/lab results for a ${profile.age}-year-old ${profile.gender}.
    Existing conditions: ${profile.diseaseConditions || 'None'}
    
    New Readings:
    Total Cholesterol: ${logData.totalCholesterol || 'N/A'} mg/dL
    LDL: ${logData.ldl || 'N/A'} mg/dL
    HDL: ${logData.hdl || 'N/A'} mg/dL
    Lp(a): ${logData.lpa || 'N/A'} mg/dL
    Random Glucose: ${logData.randomGlucose || 'N/A'} mg/dL
    HbA1c: ${logData.hba1c || 'N/A'} %
    Blood Pressure: ${logData.bloodPressureSystolic || 'N/A'} / ${logData.bloodPressureDiastolic || 'N/A'} mmHg

    Please evaluate these readings. Provide an overall status report, list any critical out-of-range alerts, and suggest concrete improvements.
    Respond in ${language === 'ar' ? 'Arabic' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Biomarker analysis error:", error);
    return null;
  }
}

export async function analyzeMood(
  emoji: string,
  coreEmotion: string | undefined,
  subEmotion: string | undefined,
  somaticLocations: string[] | undefined,
  intensity: number,
  stressLevel: number,
  sleepHours: number,
  notes: string,
  userProfileContext: string,
  language: string = "English"
): Promise<{
  emotionalPattern: string;
  impactOnBrain: string;
  impactOnHeart: string;
  impactOnBody: string;
  recommendation: string;
  sentiment?: string;
}> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `
    You are a clinical psychologist and physiological health expert.
    Analyze the following brief mood log, taking into account the user's broader health profile.
    
    User Profile Context:
    "${userProfileContext}"
    
    Mood Log:
    Mood/Feeling: ${emoji} (Core: ${coreEmotion || 'N/A'}, Sub: ${subEmotion || 'N/A'}) (Intensity: ${intensity}/10)
    Stress Level: ${stressLevel}/10
    Somatic Focus (Body Parts): ${somaticLocations && somaticLocations.length > 0 ? somaticLocations.join(', ') : 'None specified'}
    Sleep: ${sleepHours} hours
    Notes (potentially from voice transcription): ${notes}

    Provide an insightful analysis connecting their mood to their physical health, heavily factoring in their baseline profile.
    Include a somatic glossary insight if body parts are specified (e.g. mapping "Jaw" to suppressed frustration).
    Analyze the sentiment and urgency of their notes (if any) indicating signs of burnout or specific underlying emotional states.
    CRITICAL INSTRUCTION: You MUST output all text strings in ${language}, except for 'sentiment' which MUST be one of the enums if provided.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotionalPattern: { type: Type.STRING, description: `A short 1-sentence observation of their emotional state considering their baseline profile in ${language}.` },
            impactOnBrain: { type: Type.STRING, description: `1 sentence explaining how this state and sleep level impacts their neurochemistry and cognitive function based on their profile in ${language}.` },
            impactOnHeart: { type: Type.STRING, description: `1 sentence explaining the cardiovascular impact of this mood/stress level considering their weight/BMI/habits in ${language}.` },
            impactOnBody: { type: Type.STRING, description: `1 sentence explaining the systemic/somatic impact considering their medical conditions, diet, and somatic locations in ${language}.` },
            recommendation: { type: Type.STRING, description: `1 actionable, highly effective tip explicitly linking their somatic focus or context to their profile in ${language}.` },
            sentiment: { type: Type.STRING, description: `The detected sentiment from the notes and emotions. Enum: 'Positive', 'Negative', 'Neutral', 'Burnout Risk'`, enum: ["Positive", "Negative", "Neutral", "Burnout Risk"] }
          },
          required: ["emotionalPattern", "impactOnBrain", "impactOnHeart", "impactOnBody", "recommendation"]
        }
      },
    });
    
    const jsonStr = response.text?.trim() || "";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Mood analysis failed:", error);
    return {
      emotionalPattern: "Could not analyze emotional pattern.",
      impactOnBrain: "N/A",
      impactOnHeart: "N/A",
      impactOnBody: "N/A",
      recommendation: "Try to maintain a balanced lifestyle and get enough rest."
    };
  }
}

export async function generateWeeklyRecap(
  moodLogs: any[],
  userProfileContext: string,
  language: string = "English"
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const recentLogs = moodLogs.slice(0, 7).map(l => 
    `Date: ${new Date(l.date).toLocaleDateString()}, Emotion: ${l.coreEmotion}(${l.subEmotion}), Stress: ${l.stressLevel}, Sleep: ${l.sleepHours}, Triggers: ${l.triggers?.join(', ')}, Somatic: ${l.somaticLocations?.join(', ')}`
  ).join('\n');

  const prompt = `
    You are an empathetic, highly skilled clinical psychologist.
    Generate a "Week in Review" recap report based on the user's past 7 mood logs.
    
    User Profile Context:
    "${userProfileContext}"
    
    Recent Logs:
    ${recentLogs}

    Format the response in visually appealing **Markdown**. Do NOT output standard plain text. Use Headings (###), bullet points, and appropriate emojis to make it engaging and readable.
    
    Include the following sections (or similar ones depending on the data):
    - ### 📊 The Big Picture
      (A 1-2 paragraph summary of their emotional journey over the week)
    - ### 🔍 Key Observations
      (Identify trends, e.g., stress correlation with sleep, triggers. Use bullet points)
    - ### 🌟 Wins & Celebrations
      (Celebrate positive behaviors, honesty in tracking, emotional diversity. Use bullet points)
    - ### 💡 Gentle Reflection
      (A gentle, encouraging closing thought or recommendation)

    CRITICAL INSTRUCTION: You MUST output all text strings in ${language}. Your entire output must be valid Markdown.
  `;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });
    return response.text || "Unable to generate recap.";
  } catch (error) {
    console.error("Recap analysis failed:", error);
    return "Failed to generate weekly recap.";
  }
}
export async function extractBiomarkers(base64Data: string, mimeType: string, language: string) {
  const getAiKey = () => {
    let key = process.env.GEMINI_API_KEY;
    if (!key) {
      const parts = document.cookie.split(`gemini_api_key=`);
      if (parts.length === 2) {
        key = parts.pop()?.split(';').shift();
      }
    }
    return key || '';
  };
  
  const key = getAiKey();
  if (!key) return null;
  const ai = new GoogleGenAI({ apiKey: key });

  try {
    let base64Clean = base64Data;
    if (base64Data.startsWith('data:')) {
      base64Clean = base64Data.split(',')[1];
    }
    
    // Check if it's an image or PDF
    const validMimes = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
    if (!validMimes.includes(mimeType)) {
       throw new Error(`Unsupported mime type: ${mimeType}`);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Clean, mimeType: mimeType } },
            { text: `Extract the following clinical biomarkers from this lab result document or photo. If a value is missing, return null for it. Ensure numbers are Extracted as clean digits (e.g. 120).
            The user speaks ${language}, so any notes or comments should be localized, but the metrics themselves should be standard numbers.
            
            Metrics needed:
            - totalCholesterol (mg/dL)
            - ldl (mg/dL)
            - hdl (mg/dL)
            - lpa (mg/dL or nmol/L)
            - randomGlucose (mg/dL)
            - hba1c (%)
            - bloodPressureSystolic (mmHg)
            - bloodPressureDiastolic (mmHg)
            ` }
          ]
        }
      ],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             totalCholesterol: { type: Type.NUMBER, nullable: true },
             ldl: { type: Type.NUMBER, nullable: true },
             hdl: { type: Type.NUMBER, nullable: true },
             lpa: { type: Type.NUMBER, nullable: true },
             randomGlucose: { type: Type.NUMBER, nullable: true },
             hba1c: { type: Type.NUMBER, nullable: true },
             bloodPressureSystolic: { type: Type.NUMBER, nullable: true },
             bloodPressureDiastolic: { type: Type.NUMBER, nullable: true }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Biomarker extraction error:", error);
    return null;
  }
}

export async function generateDailyQuests(
  profileContext: string,
  actionPlanStr: string,
  language: string = "English"
): Promise<{ id: string, text: string, completed: boolean }[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
    Based on the user's profile and their long-term action plan, generate exactly 3 micro-quests for today.
    These must be bite-sized, specific, highly actionable, and easy to complete in under 5 minutes.
    
    User Profile:
    ${profileContext}
    
    Action Plan Context:
    ${actionPlanStr}

    Respond in ${language}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The concise description of the quest (max 60 chars)." }
            },
            required: ["text"]
          }
        }
      }
    });

    if (response.text) {
      const items = JSON.parse(response.text);
      return items.map((item: any, i: number) => ({
        id: "quest_" + Date.now() + "_" + i,
        text: item.text,
        completed: false
      }));
    }
    return [];
  } catch (err) {
    console.error("Daily Quests Error", err);
    return [];
  }
}

export async function generateFutureLetter(userProfile: string, metricsContext: string, apiKey?: string): Promise<string> {
  const gApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!gApiKey) throw new Error("GEMINI_API_KEY not set");
  const ai = new GoogleGenAI({ apiKey: gApiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `You are the user's Future Self, writing back from 10 years in the future (the year 2036). 
The user met all their health goals and was consistent recently.

Write a deeply emotional and encouraging letter, expressing profound gratitude for the good choices they are making *right now*.
Reference concrete things (like holding grandchildren, traveling without pain, feeling energetic, etc.).

Keep the letter extremely heartfelt, and specifically reflect their current positive trajectory based on these recent metrics:
${metricsContext}

About the user:
${userProfile}

IMPORTANT:
- Keep it under 150 words.
- Format it nicely with paragraph breaks and sign off as 'Your Future Self (2036)'.`
          }]
        }
      ]
    });

    return response.text || "Dear past self, thank you for your hard work.";
  } catch (err) {
    console.error("Future Letter Error", err);
    return "Dear past self, thank you for your hard work. Stay strong! - Your Future Self";
  }
}

export async function generateHCPReport(
  contextQuery: string,
  foodSummary: string,
  moodSummary: string,
  biomarkerSummary: string,
  actionPlan: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `You are an expert AI clinical health assistant. Generate a highly structured, concise, and professional Health Report for a busy Healthcare Provider (HCP) based on the patient's holistic health data.

Patient Profile & Metrics:
${contextQuery}

Eating Habit Data:
${foodSummary}

Mood Data:
${moodSummary}

Biomarker Data:
${biomarkerSummary}

Action Plan Enrolled:
${actionPlan}

Fill out the data accurately based on the provided patient data. Limit the report to be highly scannable, dense with information, and without fluff. Keep summaries concise.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "You are a clinical synthesis AI writing for medical professionals.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING, description: "A concise, 2-3 sentence overview of the patient's current trajectory, age, key issues, and primary goal" },
            pointsOfInterest: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array of bullet points of the most critical red flags or positive indicators that the HCP should know immediately" },
            eatingHabitsSummary: { type: Type.STRING, description: "Summary of eating habits" },
            eatingHabitsPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific macronutrient imbalances or bad/good habits observed in the logs" },
            moodSummary: { type: Type.STRING, description: "Summary of the emotional and stress data" },
            moodPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific stress levels, sleep patterns, and correlations to their health" },
            biomarkersSummary: { type: Type.STRING, description: "Summary of the biomarker tracking" },
            biomarkerPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any out-of-range indicators or trends that need clinical attention" },
            actionPlanSupport: { type: Type.STRING, description: "A brief note to the HCP on the AI-generated action plan the user is pursuing, and where the HCP might want to offer medical supervision" }
          },
          required: ["overview", "pointsOfInterest", "eatingHabitsSummary", "eatingHabitsPoints", "moodSummary", "moodPoints", "biomarkersSummary", "biomarkerPoints", "actionPlanSupport"]
        }
      }
    });

    if (!response.text) return "Report generation failed.";
    const data = JSON.parse(response.text);

    return `## Overview

${data.overview}

## Points of Interest

${data.pointsOfInterest.map((p: string) => `* ${p}`).join('\n')}

## Overview on Eating Habits

${data.eatingHabitsSummary}

**Points of Interest:**

${data.eatingHabitsPoints.map((p: string) => `* ${p}`).join('\n')}

## Overview on Mood

${data.moodSummary}

**Points of Interest:**

${data.moodPoints.map((p: string) => `* ${p}`).join('\n')}

## Overview on Biomarkers

${data.biomarkersSummary}

**Points of Interest:**

${data.biomarkerPoints.map((p: string) => `* ${p}`).join('\n')}

## Prescribed Action Plan Support

${data.actionPlanSupport}`;
  } catch (err) {
    console.error("HCP Report Error", err);
    throw err;
  }
}

export async function extractAvatarDescription(
  age: number,
  gender: string,
  height: number,
  weight: number,
  bmi: string,
  base64Image?: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const prompt = `You are an expert avatar designer. Your task is to generate a comprehensive, visually rich 1-paragraph description of a realistic 3D digital avatar representing a user.
Demographics: Age ${age}, Gender ${gender}, Height ${height}cm, Weight ${weight}kg, BMI ${bmi}.
Be highly descriptive about their body shape (underweight, athletic, average, overweight, obese, etc.) according to the BMI/weight/height.
${base64Image ? "Also attached is a photo of the user. Incorporate their facial features, skin tone, eye color, hair color/style, and general vibe into the avatar design." : "Do your best to define an accurate physical look for this demographic."}
Keep it to one paragraph. Avoid mentioning age or demographic numbers directly. Focus heavily on visual physical descriptions, body proportions, and facial features. Do not talk about the final image style, just the avatar's physical description and properties!`;

  const contents: any[] = [{ role: "user", parts: [{ text: prompt }] }];
  
  if (base64Image && base64Image.startsWith('data:')) {
      const mimeType = base64Image.match(/data:(.*?);base64,/)?.[1] || "image/jpeg";
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      contents[0].parts.push({
          inlineData: {
              data: base64Data,
              mimeType: mimeType
          }
      });
  }

  let attempt = 0;
  const maxRetries = 3;

  while (attempt <= maxRetries) {
      try {
          const response = await ai.models.generateContent({
              model: 'gemini-3.1-flash-lite',
              contents: contents
          });
          return response.text || "A standard avatar.";
      } catch (error: any) {
          console.error(`Failed to extract avatar desc (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
          if (attempt === maxRetries) {
              return "A standard avatar.";
          }
          
          const errorMsg = error?.message || error?.toString() || "";
          const is503 = error?.status === 503 || error?.status === "UNAVAILABLE" || errorMsg.includes("503") || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("overloaded");
          const is429 = error?.status === 429 || error?.status === "RESOURCE_EXHAUSTED" || errorMsg.includes("429");
          
          if (is503 || is429) {
              attempt++;
              await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt)));
          } else {
              return "A standard avatar.";
          }
      }
  }
  return "A standard avatar.";
}

