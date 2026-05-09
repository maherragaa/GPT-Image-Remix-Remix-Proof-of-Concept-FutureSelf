import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, Activity, FileText, MessageCircle, Layers, Droplet, Brain, Clock, X } from "lucide-react";

const tutorialSlides = [
  {
    title: "Predictive Anthropomorphic Simulation",
    description: "Welcome to your future. Synthesize your clinical and behavioral inputs to extrapolate physical aging manifestations over a 10 to 20-year horizon in a hyper-realistic 3D space.",
    icon: <Sparkles className="w-16 h-16 text-indigo-500 mb-6" />,
    color: "bg-indigo-50 border-indigo-200"
  },
  {
    title: "Clinical Biomarker Tracking",
    description: "Upload your metabolic and lipid panel reports to automatically parse, categorize, and track your structured clinical data to calculate your biological age divergence.",
    icon: <Droplet className="w-16 h-16 text-rose-500 mb-6" />,
    color: "bg-rose-50 border-rose-200"
  },
  {
    title: "Psycho-Somatic Mood Logging",
    description: "Log your emotional check-ins on our Somatic Body Map. Correlate physiological responses like sleep and stress with your emotional states and pinpoint event triggers.",
    icon: <Brain className="w-16 h-16 text-amber-500 mb-6" />,
    color: "bg-amber-50 border-amber-200"
  },
  {
    title: "AI Wellbeing Advisor",
    description: "Interact with a conversational AI agent acting as a behavioral nudge engine. Get evidence-based, actionable lifestyle recommendations based on your evolving health profile.",
    icon: <MessageCircle className="w-16 h-16 text-blue-500 mb-6" />,
    color: "bg-blue-50 border-blue-200"
  },
  {
    title: "Temporal Displacement & Reflection",
    description: "Formulate therapeutic interactions with your 'Future Self'. Establish long-term emotional investments to improve adherence to your behavioral health interventions.",
    icon: <Clock className="w-16 h-16 text-emerald-500 mb-6" />,
    color: "bg-emerald-50 border-emerald-200"
  },
  {
    title: "Algorithmic Health Interventions",
    description: "Aggregate your longitudinal data streams to synthesize a multi-week behavioral protocol targeting acute decay metrics via easily manageable micro-habits.",
    icon: <FileText className="w-16 h-16 text-[#3D2B56] mb-6" />,
    color: "bg-slate-50 border-[#3D2B56]/30"
  }
];

export function OnboardingSlideshow({ isReady = true }: { isReady?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isReady) return;

    // Show tutorial after disclaimer every time the app refreshes
    const timer = setTimeout(() => setIsOpen(true), 500);
    return () => clearTimeout(timer);
  }, [isReady]);

  useEffect(() => {
    // Also listen to the event to restart the tutorial
    const handleStartTour = () => {
      setCurrentSlide(0);
      setIsOpen(true);
    };
    window.addEventListener("start-onboarding-tour", handleStartTour);
    return () => window.removeEventListener("start-onboarding-tour", handleStartTour);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md z-[110] bg-white rounded-xl overflow-hidden flex flex-col"
          >
            {/* Header / Dismiss */}
            <div className="absolute top-4 right-4 z-10">
              <button 
                onClick={handleClose}
                className="p-2 rounded-full bg-black/5 hover:bg-black/10 text-slate-500 transition-colors"
                aria-label="Skip Tutorial"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Content */}
            <div className={`p-10 flex flex-col items-center text-center transition-colors duration-500 border-b ${tutorialSlides[currentSlide].color}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-center"
                >
                  {tutorialSlides[currentSlide].icon}
                  <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">
                    {tutorialSlides[currentSlide].title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed min-h-[80px]">
                    {tutorialSlides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer / Controls */}
            <div className="p-4 md:p-6 bg-white flex flex-col space-y-6">
              {/* Dots */}
              <div className="flex justify-center space-x-2">
                {tutorialSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? "w-6 bg-[#3D2B56]" : "w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
                  className={`flex items-center px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    currentSlide === 0 
                      ? "text-slate-300 cursor-not-allowed" 
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-[#3D2B56] hover:bg-[#2A1E3C] text-white rounded-md text-sm font-semibold transition-all hover: active:scale-95"
                >
                  {currentSlide === tutorialSlides.length - 1 ? (
                    "Get Started"
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
