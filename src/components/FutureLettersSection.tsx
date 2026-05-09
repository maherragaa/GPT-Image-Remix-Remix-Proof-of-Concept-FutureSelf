import React, { useState } from "react";
import { FutureLetter, GamificationState } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateFutureLetter, generateSpeech, generateFutureAlbumImages } from "../services/geminiService";
import { Loader2, Mail, Play, Sparkles, Image, Volume2, X } from "lucide-react";
import { doc, updateDoc } from "../lib/localDb";
import { db } from "../lib/localDb";
import ReactMarkdown from "react-markdown";
import { ModuleInfoDialog } from './ModuleInfoDialog';
import { motion, AnimatePresence } from "motion/react";

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

  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

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

      // 3. Try to generate album & audio
      let albumUrls: string[] | undefined = undefined;
      let audioUrl: string | undefined = undefined;

      try {
        const generationPromises: Promise<void>[] = [];
        
        if (faceImage) {
          const strictGender = userProfile.gender.toLowerCase();
          const prompt = `Cinematic, hyper-realistic, wide aspect ratio (16:9) photo album of a ${age + 10} year old ${strictGender}. The subject MUST be a ${strictGender}, matching the identity and features of the provided reference image. The appearance MUST be normal, without any medical imagery or annotations. Show a reflection of a peaceful, active, and successful future life. You MUST strictly output 3 distinctive images depicting these 3 scenes: 1. Wearing casual wear relaxing or walking in a beautiful park or sunny cafe. 2. Wearing athletic wear actively engaging in a physical activity (e.g., at the gym, running, or active walking). 3. Wearing elegant or smart-casual wear in a modern cozy living room or nice indoor setting.`;
          
          generationPromises.push(
            generateFutureAlbumImages(prompt, faceImage).then(urls => {
              if (urls && urls.length > 0) albumUrls = urls;
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
        albumUrls,
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

              {letter.albumUrls && letter.albumUrls.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200/60">
                   <div className="flex items-center text-xs font-semibold text-purple-600 mb-3 uppercase tracking-wider">
                     <Image className="w-4 h-4 mr-1.5"/> Attached Memories
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                     {letter.albumUrls.map((url, idx) => (
                       <button key={idx} onClick={() => setEnlargedImage(url)} className="block aspect-[16/9] overflow-hidden rounded-md border border-slate-200 bg-slate-50 transition hover:ring-2 hover:ring-purple-400">
                         <img src={url} alt={`Memory ${idx + 1}`} className="w-full h-full object-cover" />
                       </button>
                     ))}
                   </div>
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

      {/* Enlarged Image Modal */}
      <AnimatePresence>
        {enlargedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setEnlargedImage(null)}
            >
              <X className="w-6 h-6" />
            </Button>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-5xl w-full max-h-[90vh] flex justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={enlargedImage}
                alt="Enlarged Memory"
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
