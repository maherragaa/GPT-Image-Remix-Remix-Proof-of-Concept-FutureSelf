import React, { useState } from "react";
import { FutureLetter, GamificationState } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateFutureLetter, generateVeoVideo, generateSpeech } from "../services/geminiService";
import { Loader2, Mail, Play, Sparkles, Video, Volume2 } from "lucide-react";
import { doc, updateDoc } from "../lib/localDb";
import { db } from "../lib/localDb";
import ReactMarkdown from "react-markdown";
import { ModuleInfoDialog } from './ModuleInfoDialog';

interface FutureLettersSectionProps {
  userId: string;
  gamification: GamificationState;
  setGamification: React.Dispatch<React.SetStateAction<GamificationState>>;
  userProfile: any;
  simulations: any[];
  faceImage: string | null;
}

export function FutureLettersSection({
  userId,
  gamification,
  setGamification,
  userProfile,
  simulations,
  faceImage
}: FutureLettersSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateLetter = async () => {
    if (!userId || simulations.length === 0) return;
    setIsGenerating(true);
    try {
      // 1. Context
      const age = userProfile.age;
      const profileCtx = `Age: ${age}, Gender: ${userProfile.gender}, Weight: ${userProfile.weight}kg.`;
      const metricsCtx = `Current Trajectory: Biologic Age ${simulations[0]?.biologicalAge || "N/A"}. Holistic Score: ${simulations[0]?.holisticHealthScore || "N/A"}.`;

      // 2. Generate text
      const letterContent = await generateFutureLetter(profileCtx, metricsCtx);

      // 3. Try to generate video & audio
      let videoUrl: string | undefined = undefined;
      let audioUrl: string | undefined = undefined;

      try {
        const generationPromises: Promise<void>[] = [];
        
        if (faceImage) {
          const strictGender = userProfile.gender.toLowerCase();
          const prompt = `A cinematic, realistic, dramatic portrait video of a ${age + 10} year old ${strictGender}. The subject MUST be a ${strictGender}, matching the identity and features of the provided reference image. Soft, emotional lighting. Looking at the camera understandingly. The character is speaking the following message: "${letterContent}"`;
          
          generationPromises.push(
            generateVeoVideo(prompt, faceImage, undefined, "16:9").then(vUrl => {
              if (vUrl) videoUrl = vUrl;
            }).catch(console.error)
          );
        }

        const voice = userProfile.gender.toLowerCase() === 'female' ? 'Kore' : 'Zephyr';
        generationPromises.push(
          generateSpeech(letterContent, voice).then(aUrl => {
            if (aUrl) audioUrl = aUrl;
          }).catch(console.error)
        );

        await Promise.all(generationPromises);
      } catch (e) {
        console.error("Error generating media", e);
      }
      

      const newLetter: FutureLetter = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: letterContent,
        isRead: false,
        videoUrl,
        audioUrl
      };

      // Always keep only the latest letter
      const letters = [newLetter];

      const newGamification = { ...gamification, futureLetters: letters };
      setGamification(newGamification);

      await updateDoc(doc(db, "users", userId), {
        gamificationJson: JSON.stringify(newGamification)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const letters = gamification.futureLetters || [];

  return (
    <div id="section-letters" className="space-y-6 pt-8 w-full relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-xl text-purple-600">
            <Mail className="w-5 h-5" />
          </div>
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-slate-800">Letters from the Future</h2>
            <ModuleInfoDialog 
              title="Temporal Displacement & Reflection"
              info={{
                purpose: "Facilitates therapeutic 'Future Self' interactions based on the psychological principle of self-continuity to improve long-term behavioral adherence.",
                dataProcessing: "User-generated letters are stored logically. AI-generated responses from the 'future' use the Gemini API, contextualized by the user's current health goals.",
                aiTransparency: "The LLM adopts a specific persona ('Future Self') using narrative generation techniques. The outputs are synthetic motivational texts, not predictive life outcomes.",
                clinicalBoundaries: "This is a psychological intervention exercise for motivation and adherence. It is not a clinical therapeutic modality or psychiatric treatment."
              }}
            />
          </div>
        </div>
        <Button 
          onClick={handleGenerateLetter} 
          disabled={isGenerating || simulations.length === 0}
          className="bg-[#3D2B56] hover:bg-[#2d1b46] text-white rounded-md"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Receive New Letter
        </Button>
      </div>

      {simulations.length === 0 && (
         <p className="text-sm text-slate-500">Run a health simulation first to receive wisdom from your future self.</p>
      )}

      {letters.length === 0 && simulations.length > 0 && !isGenerating && (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <Mail className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-sm">Your mailbox is empty. Tap "Receive New Letter" to get a transmission from your future self.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {letters.map(letter => (
          <Card key={letter.id} className="border-slate-200 overflow-hidden rounded-none md:rounded-lg hover: transition-shadow relative bg-[#FFFCF8]">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Mail className="w-32 h-32" />
            </div>
            <CardContent className="p-4 md:p-6 relative z-10 flex flex-col h-full space-y-4">
              <div className="flex justify-between items-start text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">
                <span>Subject: To My Past Self</span>
                <span>{new Date(letter.date).toLocaleDateString()}</span>
              </div>
              
              <div className="text-base md:text-sm text-slate-700 leading-loose font-serif prose whitespace-pre-wrap px-2 sm:px-4">
                <ReactMarkdown>{letter.content}</ReactMarkdown>
              </div>

              {letter.videoUrl && (
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                   <a href={letter.videoUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs font-semibold text-purple-600 hover:text-purple-700">
                     <Video className="w-4 h-4 mr-1"/> View Attached Memory
                   </a>
                </div>
              )}
              {letter.audioUrl && (
                <div className="mt-2 text-xs font-semibold text-purple-600">
                  <div className="flex items-center mb-2">
                    <Volume2 className="w-4 h-4 mr-1"/> Listen to Message
                  </div>
                  <audio controls src={letter.audioUrl} className="w-full h-8" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
