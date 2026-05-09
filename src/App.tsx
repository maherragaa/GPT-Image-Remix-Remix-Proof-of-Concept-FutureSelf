import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleGenAI } from "@google/genai";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CameraCapture } from "./components/CameraCapture";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Globe,
  RotateCcw,
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  Clock,
  Mail,
  Loader2,
  Info,
  Lightbulb,
  Stethoscope,
  Camera,
  User,
  Armchair,
  Footprints,
  Dumbbell,
  Zap,
  Pizza,
  Utensils,
  Apple,
  Sparkles,
  CigaretteOff,
  History,
  Cigarette,
  Printer,
  FileText,
  TrendingDown,
  CalendarDays,
  CheckCircle2,
  ChevronsLeftRight,
  ChevronLeft,
  ChevronRight,
  Brain,
  Smile,
  Meh,
  Frown,
  Flame,
  Coffee,
  Bed,
  Moon,
  X,
  LogIn,
  LogOut,
  Eye,
  Droplet,
  Mic,
  Keyboard,
  Plus,
  Type,
  Clipboard,
  Trophy,
  RefreshCcw,
  Video,
  List,
  HeartPulse,
  Wind,
  Edit2,
  Shirt,
  Bell,
  Layers,
  MessageCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  ScrubsIcon,
  AthleticFemaleIcon,
  AthleticMaleIcon,
  CasualFemaleIcon,
  CasualMaleIcon,
} from "./components/OutfitIcons";
import {
  generateCombinedHealthSimulation,
  generateHealthSimulation,
  generateHealthImage,
  HealthSimulation,
  generateActionPlan,
  generateVeoVideo,
  extractBiomarkers,
  generateFutureLetter,
  generateHCPReport,
  extractAvatarDescription,
} from "./services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Markdown from "react-markdown";
import { Drawer } from "vaul";
import { useAuth } from "./contexts/AuthContext";
import { useLanguage, LANGUAGES, Language } from "./contexts/LanguageContext";
import {
  db,
  storage,
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDoc,
  getDocs,
  updateDoc,
  ref,
  uploadString,
  getDownloadURL,
  deleteDoc,
  writeBatch,
  orderBy,
} from "./lib/localDb";

// Animation Variants for Dashboard Elements
const dashboardContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const dashboardItemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export interface FoodLog {
  uid: string;
  id?: string;
  foodName: string;
  date: string;
  imageUrl?: string;
  createdAt?: string;
  analysis: {
    calories: number;
    healthScore: number;
    healthScoreExplanation?: string;
    improvementSuggestion?: string;
    macros?: {
      protein: string;
      carbs: string;
      fats: string;
    };
    details: string;
    impactOnArteries: string;
    impactOnHeart: string;
    impactOnBody: string;
  };
}

export interface FutureLetter {
  id: string;
  date: string;
  content: string;
  isRead: boolean;
  videoUrl?: string;
  audioUrl?: string;
  albumUrls?: string[];
}

export interface OrganBadge {
  id: string; // e.g. "heart", "lungs", "mind"
  name: string; // e.g., "Iron Heart", "Crystal Lungs", "Zen Mind"
  level: number;
  icon: string;
}

export interface GamificationState {
  uid: string;
  vitalityStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
  timeEarnedMinutes: number;
  timeEarnedHistory?: {
    timestamp: string;
    minutesDelta: number;
    totalMinutes: number;
    reason: string;
  }[];
  dailyQuests: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  questsDate: string; // YYYY-MM-DD
  badges?: OrganBadge[];
  futureLetters?: FutureLetter[];
}

export interface MoodLog {
  uid: string;
  id?: string;
  date: string;
  emoji: string;
  coreEmotion?: string;
  subEmotion?: string;
  intensity: number; // 1-10
  stressLevel: number; // 1-10
  sleepHours: number;
  notes: string;
  triggers?: string[];
  somaticLocations?: string[];
  createdAt?: string;
  analysis?: {
    emotionalPattern: string;
    impactOnBrain: string;
    impactOnHeart: string;
    impactOnBody: string;
    recommendation: string;
    sentiment?: string; // e.g. Positive, Negative, Neutral, Burnout Risk
  };
}

export interface BiomarkerLog {
  uid: string;
  id?: string;
  date: string;
  totalCholesterol?: number | null;
  ldl?: number | null;
  hdl?: number | null;
  lpa?: number | null;
  randomGlucose?: number | null;
  hba1c?: number | null;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  createdAt?: string;
  analysis?: {
    overallStatus: string;
    criticalAlerts?: string[];
    improvements?: string[];
  };
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function ApiKeySetup({ onComplete }: { onComplete: () => void }) {
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    const checkKey = async () => {
      // If the API key is statically injected via Vite's define plugin, it replaces the exact string
      // "process.env.GEMINI_API_KEY". We check this in a try/catch to avoid ReferenceErrors in case
      // "process" is undefined in the browser environment.
      try {
        const staticallyInjectedKey = process.env.GEMINI_API_KEY;
        if (staticallyInjectedKey && staticallyInjectedKey.length > 0) {
          onComplete();
          return;
        }
      } catch (e) {
        // Safely ignore if 'process' is not defined
      }

      if (window.aistudio) {
        if (await window.aistudio.hasSelectedApiKey()) {
          onComplete();
          return;
        }
      }

      setChecking(false);
    };
    checkKey();
  }, [onComplete]);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      onComplete();
    }
  };

  if (checking) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
      <Card className="max-w-md p-8 text-center space-y-6 rounded-none md:rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-[#9081B1]/20 rounded-full flex items-center justify-center mx-auto">
          <Activity className="w-8 h-8 text-[#3D2B56]" />
        </div>
        <CardTitle className="text-2xl">API Key Required</CardTitle>
        <CardDescription className="text-base">
          To generate high-quality realistic images using Gemini 3.1 Pro, you
          need to select a paid Google Cloud API key.
          <br />
          <br />
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noreferrer"
            className="text-[#9081B1] hover:underline"
          >
            Learn more about billing
          </a>
        </CardDescription>
        <Button
          onClick={handleSelectKey}
          className="w-full h-12 text-lg rounded-xl bg-slate-900 hover:bg-slate-800"
        >
          Select API Key
        </Button>
      </Card>
    </div>
  );
}

function MetricGauge({
  label,
  value,
  type,
  tooltip,
  comment,
}: {
  label: string;
  value: number;
  type: "low-good" | "high-good";
  tooltip?: string;
  comment?: string;
}) {
  // low-good: 0 is ideal, 100 is critical
  // high-good: 100 is ideal, 0 is critical

  let percentage = Math.max(0, Math.min(100, value));
  let statusText = "";
  let colorClass = "";
  let indicatorPosition = `${percentage}%`;

  if (type === "low-good") {
    if (percentage < 30) {
      statusText = "Optimal";
      colorClass = "from-emerald-400 to-emerald-500";
    } else if (percentage < 70) {
      statusText = "Elevated";
      colorClass = "from-amber-400 to-amber-500";
    } else {
      statusText = "Critical";
      colorClass = "from-red-500 to-rose-600";
    }
  } else {
    if (percentage > 70) {
      statusText = "Optimal";
      colorClass = "from-emerald-400 to-emerald-500";
    } else if (percentage > 30) {
      statusText = "Diminished";
      colorClass = "from-amber-400 to-amber-500";
    } else {
      statusText = "Critical";
      colorClass = "from-red-500 to-rose-600";
    }
  }

  return (
    <div className="space-y-2 pb-1">
      <div className="flex justify-between items-end">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3 font-medium text-slate-700 bg-white border rounded-xl">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-slate-900 leading-none">
            {value}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">
            {statusText}
          </span>
        </div>
      </div>

      {/* Segmented Track */}
      <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
        <div className="flex-1 border-r border-slate-200" />
        <div className="flex-1 border-r border-slate-200" />
        <div className="flex-1" />
        {/* Fill */}
        <div
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: indicatorPosition }}
        />
      </div>

      {comment && (
        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed border-l-2 border-slate-300 pl-2">
          {comment}
        </p>
      )}
    </div>
  );
}

export function MobileCarousel({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRight, setShowRight] = useState(false);
  const [showLeft, setShowLeft] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 10);
        setShowRight(scrollWidth > clientWidth && Math.ceil(scrollLeft) < scrollWidth - clientWidth - 10);
      }
    };
    
    // Initial check
    const timer = setTimeout(handleScroll, 300);

    const el = scrollRef.current;
    if (el) {
      // initial call in case layout is already done
      handleScroll();
      el.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      clearTimeout(timer);
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    }
  }, [children]);

  return (
    <div className="relative group">
      <div 
        className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 md:hidden transition-opacity duration-300 pointer-events-none ${showLeft ? 'opacity-100' : 'opacity-0'}`}
      >
        <button 
          onClick={() => scrollRef.current?.scrollBy({ left: -250, behavior: 'smooth' })}
          className="p-2 bg-white/95 backdrop-blur shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-slate-100 rounded-full text-[#3D2B56] pointer-events-auto active:scale-95 transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className={`flex overflow-x-auto ${className.includes('snap-') ? '' : 'snap-x snap-mandatory'} scrollbar-hide ${className}`}>
        {children}
      </div>

      <div 
        className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 md:hidden transition-opacity duration-300 pointer-events-none ${showRight ? 'opacity-100' : 'opacity-0'}`}
      >
        <button 
          onClick={() => scrollRef.current?.scrollBy({ left: 250, behavior: 'smooth' })}
          className="p-2 bg-white/95 backdrop-blur shadow-[0_2px_8px_rgba(0,0,0,0.1)] border border-slate-100 rounded-full text-[#3D2B56] animate-pulse pointer-events-auto active:scale-95 transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ToggleableMetricGauge({
  label,
  nowValue,
  nowComment,
  futureValue,
  futureComment,
  futureLabel,
  type,
  tooltip,
  className="",
}: {
  label: string;
  nowValue: number;
  nowComment?: string;
  futureValue?: number;
  futureComment?: string;
  futureLabel: string;
  type: "low-good" | "high-good";
  tooltip?: string;
  className?: string;
}) {
  const [isFuture, setIsFuture] = useState(false);
  const value = isFuture && futureValue !== undefined ? futureValue : nowValue;
  const comment =
    isFuture && futureValue !== undefined ? futureComment : nowComment;

  let percentage = Math.max(0, Math.min(100, value));
  let statusText = "";
  let colorClass = "";
  let indicatorPosition = `${percentage}%`;

  if (type === "low-good") {
    if (percentage < 30) {
      statusText = "Optimal";
      colorClass = "from-emerald-400 to-emerald-500";
    } else if (percentage < 70) {
      statusText = "Elevated";
      colorClass = "from-amber-400 to-amber-500";
    } else {
      statusText = "Critical";
      colorClass = "from-red-500 to-rose-600";
    }
  } else {
    if (percentage > 70) {
      statusText = "Optimal";
      colorClass = "from-emerald-400 to-emerald-500";
    } else if (percentage > 30) {
      statusText = "Diminished";
      colorClass = "from-amber-400 to-amber-500";
    } else {
      statusText = "Critical";
      colorClass = "from-red-500 to-rose-600";
    }
  }

  return (
    <div className={`space-y-3 p-4 md:p-5 bg-white border border-slate-100 rounded-2xl shadow-sm ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-slate-800 text-sm">{label}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-3 font-medium text-slate-700 bg-white border rounded-xl">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex bg-slate-100 rounded-full p-0.5 border border-slate-200">
          <button
            onClick={() => setIsFuture(false)}
            className={`px-2 py-0.5 text-[9px] font-semibold rounded-full transition-all ${!isFuture ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
          >
            NOW
          </button>
          <button
            onClick={() => setIsFuture(true)}
            className={`px-2 py-0.5 text-[9px] font-semibold rounded-full transition-all ${isFuture ? "bg-[#3D2B56] text-white" : "text-slate-500 hover:text-slate-700"}`}
          >
            {futureLabel.toUpperCase()}
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="flex-1" />
        <div className="text-right">
          <span className="text-lg font-bold text-slate-900 leading-none">
            {value}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 ml-1">
            {statusText}
          </span>
        </div>
      </div>

      <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
        <div className="flex-1 border-r border-slate-200" />
        <div className="flex-1 border-r border-slate-200" />
        <div className="flex-1" />
        <div
          className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out`}
          style={{ width: indicatorPosition }}
        />
      </div>

      {comment && (
        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed border-l-2 border-slate-300 pl-2">
          {comment}
        </p>
      )}
    </div>
  );
}

function ToggleableSummary({
  nowSim,
  futureSim,
  futureLabel,
}: {
  nowSim: any;
  futureSim?: any;
  futureLabel: string;
}) {
  const [isFuture, setIsFuture] = useState(false);
  const sim = isFuture && futureSim ? futureSim : nowSim;

  return (
    <div className="bg-[#3D2B56] text-white p-5 rounded-none md:rounded-lg">
      <div className="flex justify-between items-start mb-6">
        <h4 className="font-semibold opacity-90 uppercase tracking-widest text-xs m-0">
          Summary
        </h4>
        <div className="flex bg-white/10 rounded-full p-0.5 border border-white/20">
          <button
            onClick={() => setIsFuture(false)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full transition-all ${!isFuture ? "bg-white text-[#3D2B56]" : "text-white/70 hover:text-white"}`}
          >
            NOW
          </button>
          <button
            onClick={() => setIsFuture(true)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full transition-all ${isFuture ? "bg-amber-400 text-[#3D2B56]" : "text-white/70 hover:text-white"}`}
          >
            {futureLabel.toUpperCase()}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">
            Holistic Health
          </div>
          <div className="text-4xl font-bold text-emerald-400">
            {sim.holisticHealthScore ?? "--"}
            <span className="text-xl text-emerald-400/80">/100</span>
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-300 uppercase tracking-wider mb-1">
            Bio Age
          </div>
          <div className="text-4xl font-bold text-amber-400">
            {sim.biologicalAge ?? "--"}{" "}
            <span className="text-xl text-amber-400/80">yrs</span>
          </div>
        </div>
      </div>
      {(sim.metricComments?.holisticHealthScore ||
        sim.metricComments?.biologicalAge) && (
        <div className="mt-6 space-y-3 border-t border-white/10 pt-4">
          {sim.metricComments?.holisticHealthScore && (
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-emerald-400 mr-1">
                Score:
              </span>{" "}
              {sim.metricComments.holisticHealthScore}
            </p>
          )}
          {sim.metricComments?.biologicalAge && (
            <p className="text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-amber-400 mr-1">Aging:</span>{" "}
              {sim.metricComments.biologicalAge}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ToggleableInsights({
  nowSim,
  futureSim,
  futureLabel,
}: {
  nowSim: any;
  futureSim?: any;
  futureLabel: string;
}) {
  const [isFuture, setIsFuture] = useState(false);
  const sim = isFuture && futureSim ? futureSim : nowSim;

  return (
    <div className="bg-slate-50/50 rounded-none md:rounded-lg p-5 border border-[#9081B1]/30 mt-4">
      <div className="flex justify-between items-start mb-6">
        <h4 className="font-semibold opacity-80 uppercase tracking-widest text-xs text-[#3D2B56] m-0">
          Detailed Insights
        </h4>
        <div className="flex bg-white rounded-full p-0.5 border border-slate-200">
          <button
            onClick={() => setIsFuture(false)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full transition-all ${!isFuture ? "bg-[#3D2B56] text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            NOW
          </button>
          <button
            onClick={() => setIsFuture(true)}
            className={`px-3 py-1 text-[10px] sm:text-xs font-semibold rounded-full transition-all ${isFuture ? "bg-[#3D2B56] text-white" : "text-slate-500 hover:text-slate-800"}`}
          >
            {futureLabel.toUpperCase()}
          </button>
        </div>
      </div>

      <MobileCarousel className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-2 px-2 pb-2 md:grid md:grid-cols-1 md:gap-4 md:mx-0 md:px-0 md:pb-0 space-x-3 md:space-x-0">
        <div className="snap-center shrink-0 w-[85vw] md:w-auto bg-white rounded-xl p-4 border border-slate-100 flex items-start space-x-3 relative whitespace-normal">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-slate-700 text-sm leading-relaxed font-medium">
            {sim.explanation}
          </p>
        </div>
        <div className="snap-center shrink-0 w-[85vw] md:w-auto bg-white rounded-xl p-4 border border-slate-100 flex items-start space-x-3 relative whitespace-normal">
          <Brain className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
          <p className="text-slate-700 text-sm leading-relaxed font-medium">
            {sim.psychologicalState}
          </p>
        </div>
      </MobileCarousel>
    </div>
  );
}

const LOADING_FACTS = [
  "Did you know? Your body replaces 330 billion cells daily.",
  "Your blood vessels could circle the globe twice.",
  "The human heart beats about 115,000 times a day.",
  "AI is analyzing over 1,400 biometric datapoints.",
  "Your brain generates enough electricity to power a small lightbulb.",
  "Your liver can regenerate itself from just 25% of its original mass.",
  "Synthesizing your cardiovascular trajectory based on lifestyle...",
  "Sleep optimization can increase immune function by up to 40%.",
];

function SmartLoader({ message = "Generating..." }: { message?: string }) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % LOADING_FACTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10 w-full h-full text-center p-6 space-y-4">
      <div className="relative mx-auto w-16 h-16">
        <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-[#3D2B56] border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#3D2B56] animate-pulse" />
        </div>
      </div>
      <div>
        <p className="font-bold text-slate-800 animate-pulse">{message}</p>
        <p className="text-xs font-mono text-slate-500 mt-2 max-w-[200px] mx-auto h-8 flex items-center justify-center transition-opacity duration-500">
          {LOADING_FACTS[factIndex]}
        </p>
      </div>
    </div>
  );
}

function ImageComparisonSlider({
  baseImage,
  overlayImage,
  baseLabel,
  overlayLabel,
  isLoading,
  imageClassName = "object-cover",
  hasFailed,
  onRegenerate,
}: {
  baseImage?: string | null;
  overlayImage?: string | null;
  baseLabel: string;
  overlayLabel: string;
  isLoading: boolean;
  imageClassName?: string;
  hasFailed?: boolean;
  onRegenerate?: () => void;
}) {
  const [position, setPosition] = React.useState(50);

  if (hasFailed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 text-red-500 p-4text-center space-y-3">
        <AlertTriangle className="w-8 h-8 opacity-50" />
        <span className="text-sm font-semibold">Generation Failed</span>
        {onRegenerate && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-100"
            onClick={onRegenerate}
          >
            <RefreshCcw className="w-4 h-4 mr-2" /> Regenerate
          </Button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return <SmartLoader message="Synthesizing Comparison..." />;
  }

  if (!baseImage || !overlayImage) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-black/40 text-sm">
        Comparison images not available.
      </div>
    );
  }

  return (
    <>
      {/* Base Image (Current Trajectory) */}
      <img
        src={baseImage || undefined}
        alt={baseLabel}
        className={`absolute inset-0 w-full h-full pointer-events-none ${imageClassName}`}
      />

      {/* Overlay Image (Optimized Trajectory) */}
      <img
        src={overlayImage || undefined}
        alt={overlayLabel}
        className={`absolute inset-0 w-full h-full pointer-events-none ${imageClassName}`}
        style={{
          clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)`,
        }}
      />

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-[#9081B1] text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none z-10">
        {overlayLabel}
      </div>
      <div className="absolute top-4 right-4 bg-[#3D2B56] text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none z-10">
        {baseLabel}
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white z-20 flex items-center justify-center pointer-events-none"
        style={{ left: `calc(${position}% - 2px)` }}
      >
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 text-black/40">
          <ChevronsLeftRight className="w-5 h-5" />
        </div>
      </div>

      {/* Invisible Range Input for Interaction */}
      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 touch-none"
        dir="ltr"
        style={{ direction: "ltr" }}
      />
    </>
  );
}

import { HealthModel3D } from "./components/HealthModel3D";
import { MoodTracking } from "./components/MoodTracking";
import { BiomarkerTracking } from "./components/BiomarkerTracking";
import { WellbeingAdvisorChat } from "./components/WellbeingAdvisorChat";
import { FutureLettersSection } from "./components/FutureLettersSection";
import { NotificationManager } from "./components/NotificationManager";
import { ModuleInfoDialog } from "./components/ModuleInfoDialog";
import { OnboardingSlideshow } from "./components/OnboardingSlideshow";

const loadingStatuses = {
  English: [
    "Analyzing critical health data...",
    "Correlating biomarkers...",
    "Applying chronological aging models...",
    "Synthesizing holistic trajectory...",
    "Rendering anatomical visuals...",
    "Finalizing medical predictions...",
  ],
  Arabic: [
    "جاري تحليل البيانات الصحية...",
    "ربط المؤشرات الحيوية...",
    "تطبيق نماذج الشيخوخة الزمنية...",
    "توليف المسار الشامل...",
    "تقديم الصور التشريحية...",
    "وضع اللمسات الأخيرة للتنبؤات...",
  ],
};

const loadingTips = {
  English: [
    "Did you know? Regular moderate exercise can lower biological age by up to 9 years.",
    "Small consistent changes in diet compound over decades to drastically alter cardiovascular health.",
    "Stress directly affects telomere length, which is a major indicator of cellular aging.",
    "Your future is not set in stone—every choice you make today builds a different tomorrow.",
    "High-quality sleep is when your brain performs critical vascular and neural maintenance.",
  ],
  Arabic: [
    "هل تعلم؟ التمارين المعتدلة بانتظام يمكن أن تخفض العمر البيولوجي بما يصل إلى 9 سنوات.",
    "تتراكم التغييرات الطفيفة المستمرة في النظام الغذائي على مدى عقود لتغيير صحة القلب والأوعية الدموية بشكل جذري.",
    "الإجهاد يؤثر بشكل مباشر على طول التيلومير، وهو مؤشر رئيسي للشيخوخة الخلوية.",
    "مستقبلك ليس محتومًا - كل خيار تتخذه اليوم يبني غدًا مختلفًا.",
    "النوم عالي الجودة هو الوقت الذي يقوم فيه الدماغ بصيانة الأوعية الدموية والعصبية بفاعلية عالية.",
  ],
};

const LoadingStatusText = ({ language }: { language: string }) => {
  const [index, setIndex] = useState(0);
  const statuses =
    loadingStatuses[language as keyof typeof loadingStatuses] ||
    loadingStatuses["English"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % statuses.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [statuses.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        transition={{ duration: 0.5 }}
        className="text-[#3D2B56] text-xl font-medium tracking-wide h-8"
      >
        {statuses[index]}
      </motion.p>
    </AnimatePresence>
  );
};

const LoadingTipRotator = ({ language }: { language: string }) => {
  const [index, setIndex] = useState(0);
  const tips =
    loadingTips[language as keyof typeof loadingTips] || loadingTips["English"];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % tips.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="text-slate-600 text-sm font-medium leading-relaxed h-16 flex items-center justify-center"
      >
        "{tips[index]}"
      </motion.p>
    </AnimatePresence>
  );
};

export default function App() {
  const {
    user,
    isGuest,
    loading: authLoading,
    authError,
    loginWithGoogle,
    logout,
  } = useAuth();
  const { language, setLanguage, t, dir } = useLanguage();
  const needsDirectLogin = false;
  const forceLogin = async () => {};

  const [age, setAge] = useState<number>(35);
  const [gender, setGender] = useState<string>("Male");
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(75);
  const [activityLevel, setActivityLevel] = useState<string>("Moderate");
  const [diet, setDiet] = useState<string>("Average");
  const [smokingStatus, setSmokingStatus] = useState<string>("Never");
  const [diseaseConditions, setDiseaseConditions] = useState<string>("");
  const [stressLevel, setStressLevel] = useState<string>("Moderate");
  const [sleepQuality, setSleepQuality] = useState<string>("Average");
  const [outfit, setOutfit] = useState<string>(
    "Standard Medical Uniform (Scrubs)",
  );

  // Biomarkers
  const [totalCholesterol, setTotalCholesterol] = useState<number | null>(null);
  const [ldl, setLdl] = useState<number | null>(null);
  const [hdl, setHdl] = useState<number | null>(null);
  const [lpa, setLpa] = useState<number | null>(null);
  const [randomGlucose, setRandomGlucose] = useState<number | null>(null);
  const [hba1c, setHba1c] = useState<number | null>(null);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<
    number | null
  >(null);
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<
    number | null
  >(null);
  const [isExtractingBiomarkers, setIsExtractingBiomarkers] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{
    extracted: any;
    found: string[];
    missing: string[];
  } | null>(null);

  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<"avatar" | "hyperrealistic">(
    "avatar",
  );
  const [avatarDescription, setAvatarDescription] = useState<string | null>(
    null,
  );
  const [onboardingStep, setOnboardingStep] = useState(1);
  // Microscopic View States
  const [microVideos, setMicroVideos] = useState<{
    brain: string | null;
    arteries: string | null;
    heart: string | null;
  }>({ brain: null, arteries: null, heart: null });
  const [isGeneratingMicro, setIsGeneratingMicro] = useState<{
    brain: boolean;
    arteries: boolean;
    heart: boolean;
  }>({ brain: false, arteries: false, heart: false });
  const [microErrors, setMicroErrors] = useState<{
    brain: string | null;
    arteries: string | null;
    heart: string | null;
  }>({ brain: null, arteries: null, heart: null });

  const handleGenerateMicroVideo = async (
    organ: "brain" | "arteries" | "heart",
  ) => {
    setIsGeneratingMicro((prev) => ({ ...prev, [organ]: true }));
    setMicroErrors((prev) => ({ ...prev, [organ]: null }));
    try {
      let prompt = "";
      const recentMood = moodLogs.length > 0 ? moodLogs[0] : null;
      if (organ === "brain")
        prompt = `A highly detailed, cinematic 9-second microscopic 3D medical animation of a human brain's neural network. ${stressLevel === "High" || stressLevel === "Severe" || (recentMood && recentMood.stressLevel > 7) ? "The neurons are firing erratically and rapidly, glowing with harsh red flashes, showing intense stress." : "The neurons are firing smoothly with a calming blue and golden healthy glow."}`;
      if (organ === "arteries")
        prompt = `A highly detailed, cinematic 9-second microscopic 3D medical animation inside a human blood vessel. ${smokingStatus === "Current" || diet === "Poor" ? "Yellow cholesterol plaque is visibly building up on the artery walls, dangerously restricting the flow of red blood cells." : "The artery walls are smooth and clean, with red blood cells flowing freely and healthily."}`;
      if (organ === "heart")
        prompt = `A highly detailed, cinematic 9-second 3D medical animation of beating human heart muscle tissue. ${activityLevel === "Sedentary" || activityLevel === "Light" ? "The muscle fibers look slightly strained and sluggish during contractions." : "The heart muscle fibers are thick, strong, and contracting with powerful, rhythmic vigor."}`;

      const url = await generateVeoVideo(prompt, undefined);
      if (url) {
        setMicroVideos((prev) => ({ ...prev, [organ]: url }));
      } else {
        setMicroErrors((prev) => ({
          ...prev,
          [organ]: t("Failed to generate video."),
        }));
      }
    } catch (e) {
      console.error(e);
      setMicroErrors((prev) => ({
        ...prev,
        [organ]: t("An error occurred during video generation."),
      }));
    } finally {
      setIsGeneratingMicro((prev) => ({ ...prev, [organ]: false }));
    }
  };

  // Load from Firebase
  useEffect(() => {
    if (!user) {
      setSimulations([]);
      setOptimizedSimulations([]);
      setActionPlan(null);
      setFoodLogs([]);
      return;
    }

    // Subscribe to profile
    const unsubProfile = onSnapshot(doc(db, "profiles", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAge(data.age);
        setGender(data.gender);
        setHeight(data.height);
        setWeight(data.weight);
        setActivityLevel(data.activityLevel);
        setDiet(data.diet);
        if (data.smokingStatus) setSmokingStatus(data.smokingStatus);
        if (data.diseaseConditions)
          setDiseaseConditions(data.diseaseConditions);
        if (data.stressLevel) setStressLevel(data.stressLevel);
        if (data.sleepQuality) setSleepQuality(data.sleepQuality);
        if (data.totalCholesterol !== undefined)
          setTotalCholesterol(data.totalCholesterol);
        if (data.ldl !== undefined) setLdl(data.ldl);
        if (data.hdl !== undefined) setHdl(data.hdl);
        if (data.lpa !== undefined) setLpa(data.lpa);
        if (data.randomGlucose !== undefined)
          setRandomGlucose(data.randomGlucose);
        if (data.hba1c !== undefined) setHba1c(data.hba1c);
        if (data.bloodPressureSystolic !== undefined)
          setBloodPressureSystolic(data.bloodPressureSystolic);
        if (data.bloodPressureDiastolic !== undefined)
          setBloodPressureDiastolic(data.bloodPressureDiastolic);
        if (data.hcpReport) setHcpReport(data.hcpReport);
        if (data.faceImage) setFaceImage(data.faceImage);
        if (data.imageStyle) setImageStyle(data.imageStyle);
        if (data.avatarDescription)
          setAvatarDescription(data.avatarDescription);
      }
    });

    // Subscribe to simulations
    const unsubSims = onSnapshot(doc(db, "simulations", user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.simulationsJson)
          setSimulations(JSON.parse(data.simulationsJson));
        if (data.optimizedSimulationsJson)
          setOptimizedSimulations(JSON.parse(data.optimizedSimulationsJson));
        if (data.actionPlan) setActionPlan(data.actionPlan);
        if (data.generatedImagesJson)
          setGeneratedImages(JSON.parse(data.generatedImagesJson));
        if (data.optimizedImagesJson)
          setOptimizedImages(JSON.parse(data.optimizedImagesJson));
      }
    });

    // Subscribe to food logs
    const q = query(collection(db, "foodLogs"), where("uid", "==", user.uid));
    const unsubFoodLogs = onSnapshot(q, (snapshot) => {
      const logs: FoodLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as FoodLog);
      });
      // Sort in memory after fetch given we didn't setup composite indexes here
      logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setFoodLogs(logs);
    });

    // Subscribe to mood logs
    const moodQuery = query(
      collection(db, "moodLogs"),
      where("uid", "==", user.uid),
    );
    const unsubMoodLogs = onSnapshot(moodQuery, (snapshot) => {
      const logs: MoodLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as MoodLog);
      });
      logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setMoodLogs(logs);
    });

    // Subscribe to biomarker logs
    const biomarkerQuery = query(
      collection(db, "biomarkerLogs"),
      where("uid", "==", user.uid),
    );
    const unsubBiomarkerLogs = onSnapshot(biomarkerQuery, (snapshot) => {
      const logs: BiomarkerLog[] = [];
      snapshot.forEach((doc) => {
        logs.push(doc.data() as BiomarkerLog);
      });
      logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setBiomarkerLogs(logs);
    });

    // Subscribe to gamification
    const unsubGamification = onSnapshot(
      doc(db, "gamification", user.uid),
      (snap) => {
        if (snap.exists()) {
          setGamification(snap.data() as GamificationState);
        } else {
          // Initialize if doesn't exist
          const initialGame: GamificationState = {
            uid: user.uid,
            vitalityStreak: 0,
            lastActivityDate: "",
            timeEarnedMinutes: 0,
            dailyQuests: [],
            questsDate: "",
          };
          setDoc(doc(db, "gamification", user.uid), initialGame).catch(
            console.error,
          );
          setGamification(initialGame);
        }
      },
    );

    return () => {
      unsubProfile();
      unsubSims();
      unsubFoodLogs();
      unsubMoodLogs();
      unsubBiomarkerLogs();
      unsubGamification();
    };
  }, [user]);

  // Save profile changes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!user) return;

    // Debounce saves
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      let savedFaceImage = faceImage || "";

      try {
        if (faceImage && faceImage.startsWith("data:") && storage) {
          const imageRef = ref(storage, `profiles/${user.uid}/faceImage`);
          await uploadString(imageRef, faceImage, "data_url");
          savedFaceImage = await getDownloadURL(imageRef);
        }
      } catch (err) {
        console.error(
          "Firebase Storage Error [faceImage]: Missing permissions down, failing cleanly.",
          err,
        );
      }

      setDoc(
        doc(db, "profiles", user.uid),
        {
          uid: user.uid,
          age,
          gender,
          height,
          weight,
          activityLevel,
          diet,
          smokingStatus,
          diseaseConditions,
          stressLevel,
          sleepQuality,
          totalCholesterol,
          ldl,
          hdl,
          lpa,
          randomGlucose,
          hba1c,
          bloodPressureSystolic,
          bloodPressureDiastolic,
          faceImage: savedFaceImage,
          imageStyle,
          avatarDescription,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      ).catch((err) => {
        console.error(err);
      });
    }, 1000);
  }, [
    user,
    age,
    gender,
    height,
    weight,
    activityLevel,
    diet,
    smokingStatus,
    diseaseConditions,
    stressLevel,
    sleepQuality,
    faceImage,
    imageStyle,
    avatarDescription,
    totalCholesterol,
    ldl,
    hdl,
    lpa,
    randomGlucose,
    hba1c,
    bloodPressureSystolic,
    bloodPressureDiastolic,
  ]);

  const bmi = (weight / Math.pow(height / 100, 2)).toFixed(1);
  const currentRunId = useRef<number>(0);
  const [simulations, setSimulations] = useState<HealthSimulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    Record<
      string,
      {
        body: string | null;
        heart: string | null;
        arteries: string | null;
        brain: string | null;
      }
    >
  >({});
  const [generatingImages, setGeneratingImages] = useState<
    Record<string, boolean>
  >({});
  const [failedGenerations, setFailedGenerations] = useState<
    Record<string, boolean>
  >({});
  const [failedOptimized, setFailedOptimized] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [selectedFuture, setSelectedFuture] = useState<string>("10 Years");

  const [optimizedSimulations, setOptimizedSimulations] = useState<
    HealthSimulation[]
  >([]);
  const [optimizedImages, setOptimizedImages] = useState<{
    body: string | null;
    heart: string | null;
    arteries: string | null;
    brain: string | null;
  } | null>(null);
  const [generatingOptimizedImage, setGeneratingOptimizedImage] =
    useState(false);
  const [actionPlan, setActionPlan] = useState<string | null>(null);
  const [hcpReport, setHcpReport] = useState<string | null>(null);
  const [generatingHcp, setGeneratingHcp] = useState(false);

  const timelineReadyTriggered = useRef(false);
  const takeControlReadyTriggered = useRef(false);
  const [showTimelineToast, setShowTimelineToast] = useState(false);
  const [showTakeControlToast, setShowTakeControlToast] = useState(false);

  const [showHcpModal, setShowHcpModal] = useState(false);
  const [loadingActionPlan, setLoadingActionPlan] = useState(false);
  const [generatingQuests, setGeneratingQuests] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "timeline"
    | "optimized"
    | "actionPlan"
    | "3dView"
    | "foodTracking"
    | "moodTracking"
    | "timeLapseVideo"
    | "microscopic"
    | "biomarkerTracking"
    | "achievements"
  >("profile");
  const [showFoodLogDrawer, setShowFoodLogDrawer] = useState(false);
  const [showMoodLogDrawer, setShowMoodLogDrawer] = useState(false);
  const [showBiomarkerDrawer, setShowBiomarkerDrawer] = useState(false);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [showSectionsMenu, setShowSectionsMenu] = useState(false);

  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [biomarkerLogs, setBiomarkerLogs] = useState<BiomarkerLog[]>([]);
  const [gamification, setGamification] = useState<GamificationState | null>(
    null,
  );
  const [showTimeEarnedAnim, setShowTimeEarnedAnim] = useState(0);

  const [showPocModal, setShowPocModal] = useState(true);

  useEffect(() => {
    // Modal appears on every refresh now, no localStorage check needed.
  }, []);

  useEffect(() => {
    if (!gamification || !user || !actionPlan) return;
    const today = new Date().toISOString().slice(0, 10);
    if (gamification.questsDate !== today && !generatingQuests) {
      setGeneratingQuests(true);
      const userProfileStr = `Age: ${age}, Gender: ${gender}, Weight: ${weight}kg, Activity: ${activityLevel}, Diet: ${diet}, Conditions: ${diseaseConditions || "None"}`;
      import("./services/geminiService").then(({ generateDailyQuests }) => {
        generateDailyQuests(userProfileStr, actionPlan, language)
          .then(async (newQuests) => {
            const updateData = {
              dailyQuests: newQuests,
              questsDate: today,
            };
            setGamification((prev) =>
              prev ? { ...prev, ...updateData } : null,
            );
            try {
              await setDoc(doc(db, "gamification", user.uid), updateData, {
                merge: true,
              });
            } catch (e) {
              console.error(e);
            }
          })
          .finally(() => setGeneratingQuests(false));
      });
    }
  }, [gamification?.questsDate, user, actionPlan, language]);

  const earnHealthTime = async (
    minutes: number,
    activityLog: boolean = true,
    reason: string = "Health Action",
  ) => {
    if (!gamification || !user) return;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    let baseTime = gamification.timeEarnedMinutes || 0;
    let newStreak = gamification.vitalityStreak || 0;

    // Only increment streak if this is a daily activity log and it hasn't been done today
    if (activityLog) {
      if (gamification.lastActivityDate !== today) {
        if (gamification.lastActivityDate === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1; // broken streak
        }
      }
    }

    let currentHistory = gamification.timeEarnedHistory || [];
    // Keep history reasonably sized (last 30 entries)
    if (currentHistory.length > 30) {
      currentHistory = currentHistory.slice(currentHistory.length - 30);
    }
    const newHistoryEntry = {
      timestamp: new Date().toISOString(),
      minutesDelta: minutes,
      totalMinutes: baseTime + minutes,
      reason,
    };

    const updateData: Partial<GamificationState> = {
      timeEarnedMinutes: baseTime + minutes,
      vitalityStreak: newStreak,
      timeEarnedHistory: [...currentHistory, newHistoryEntry],
    };
    if (activityLog) {
      updateData.lastActivityDate = today;
    }

    setGamification((prev) => (prev ? { ...prev, ...updateData } : null));
    setShowTimeEarnedAnim(minutes);
    setTimeout(() => setShowTimeEarnedAnim(0), 3000);

    try {
      await setDoc(doc(db, "gamification", user.uid), updateData, {
        merge: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const completeQuest = async (questId: string) => {
    if (!gamification || !user) return;
    const updatedQuests = gamification.dailyQuests.map((q) =>
      q.id === questId ? { ...q, completed: true } : q,
    );

    setGamification((prev) =>
      prev ? { ...prev, dailyQuests: updatedQuests } : null,
    );
    await setDoc(
      doc(db, "gamification", user.uid),
      { dailyQuests: updatedQuests },
      { merge: true },
    );

    // Reward for completing quest!
    earnHealthTime(30, true, "Completed Daily Quest");
  };
  const [waterIntake, setWaterIntake] = useState<number>(0);
  const [mealTranscript, setMealTranscript] = useState<string>("");
  const [isRecordingMeal, setIsRecordingMeal] = useState<boolean>(false);
  const mealRecognitionRef = useRef<any>(null);
  const parseMacroGrams = (macroStr?: string) => {
    if (!macroStr) return 0;
    const match = macroStr.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const dailyFoodLogs = useMemo(() => {
    const today = new Date().toDateString();
    return foodLogs.filter(
      (log) => new Date(log.date).toDateString() === today,
    );
  }, [foodLogs]);

  const dailyNutrition = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fats = 0;

    dailyFoodLogs.forEach((log) => {
      calories += log.analysis.calories || 0;
      if (log.analysis.macros) {
        const pPercent = parseMacroGrams(log.analysis.macros.protein);
        const cPercent = parseMacroGrams(log.analysis.macros.carbs);
        const fPercent = parseMacroGrams(log.analysis.macros.fats);
        const mealCals = log.analysis.calories || 0;

        protein += Math.round(((pPercent / 100) * mealCals) / 4);
        carbs += Math.round(((cPercent / 100) * mealCals) / 4);
        fats += Math.round(((fPercent / 100) * mealCals) / 9);
      }
    });

    return { calories, protein, carbs, fats };
  }, [dailyFoodLogs]);

  const dailyTargets = useMemo(() => {
    let bmr = weight * 10 + height * 6.25 - age * 5;
    bmr += gender === "Male" ? 5 : -161;
    let multiplier = 1.2;
    if (activityLevel === "Light") multiplier = 1.375;
    if (activityLevel === "Moderate") multiplier = 1.55;
    if (activityLevel === "Heavy") multiplier = 1.725;

    let targetCals = Math.round(bmr * multiplier);
    const targetProtein = Math.round((targetCals * 0.3) / 4);
    const targetCarbs = Math.round((targetCals * 0.4) / 4);
    const targetFats = Math.round((targetCals * 0.3) / 9);

    return {
      calories: targetCals,
      protein: targetProtein,
      carbs: targetCarbs,
      fats: targetFats,
    };
  }, [weight, height, age, gender, activityLevel]);

  const [hasNewFoodLog, setHasNewFoodLog] = useState(false);

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [hasNewMoodLog, setHasNewMoodLog] = useState(false);
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [mealDate, setMealDate] = useState<string>(
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16),
  );
  const [analyzingMeal, setAnalyzingMeal] = useState(false);

  const generationInProgress = useRef<boolean>(false);

  // Auto-resume generation if DB load was missing images
  useEffect(() => {
    if (simulations.length === 0) return;
    if (loading) return;
    if (generationInProgress.current) return;

    // Find any simulation timeframe that has no generated images (or an empty object) and hasn't explicitly failed yet
    const missingAny = simulations.some(
      (sim) =>
        (!generatedImages[sim.timeframe] ||
          Object.keys(generatedImages[sim.timeframe]).length === 0) &&
        !failedGenerations[sim.timeframe],
    );
    const missingOpt =
      optimizedSimulations.length > 0 &&
      (!optimizedImages || Object.keys(optimizedImages).length === 0) &&
      !failedOptimized;

    if (missingAny || missingOpt) {
      console.log("Resuming missing generations...");
      startSequentialGeneration(
        simulations,
        optimizedSimulations,
        age,
        gender,
        height,
        weight,
        bmi,
        activityLevel,
        diet,
        generatedImages,
      ).catch(console.error);
    }
  }, [
    simulations,
    optimizedSimulations,
    generatedImages,
    optimizedImages,
    loading,
    age,
    gender,
    height,
    weight,
    bmi,
    activityLevel,
    diet,
    failedGenerations,
    failedOptimized,
  ]);

  const parsedActionPlan = useMemo(() => {
    if (!actionPlan) return { clinicalReport: "", weeks: [] };
    const parts = actionPlan.split(/(?=##\s*Week)/i);
    let clinicalReport = "";
    const weeks: { title: string; content: string }[] = [];

    parts.forEach((part) => {
      if (/^##\s*Week/i.test(part.trim())) {
        const lines = part.trim().split("\n");
        const title = lines[0].replace(/^##\s*/, "").trim();
        const content = lines.slice(1).join("\n").trim();
        weeks.push({ title, content });
      } else {
        clinicalReport += part;
      }
    });

    clinicalReport = clinicalReport
      .replace(/^##\s*Clinical Holistic Report & Forecast/i, "")
      .replace(/^SECTION 1: CLINICAL HOLISTIC REPORT & FORECAST/i, "")
      .replace(/^SECTION 2: 30-DAY PATIENT ACTION PLAN/i, "")
      .trim();

    return { clinicalReport, weeks };
  }, [actionPlan]);

  const parsedReportCards = useMemo(() => {
    if (!parsedActionPlan.clinicalReport)
      return { summary: "", forecast: "", enablement: "" };
    const text = parsedActionPlan.clinicalReport;

    const extractContent = (
      rawText: string,
      target: string,
      stop1: string | null,
      stop2: string | null,
    ) => {
      const index = rawText.toLowerCase().indexOf(target.toLowerCase());
      if (index === -1) return "";
      const substring = rawText
        .slice(index + target.length)
        .replace(/^[:\-\s#*]+/, "");

      let stopIndex1 = stop1
        ? substring.toLowerCase().indexOf(stop1.toLowerCase())
        : -1;
      let stopIndex2 = stop2
        ? substring.toLowerCase().indexOf(stop2.toLowerCase())
        : -1;

      let end = substring.length;
      if (stopIndex1 !== -1 && stopIndex2 !== -1)
        end = Math.min(stopIndex1, stopIndex2);
      else if (stopIndex1 !== -1) end = stopIndex1;
      else if (stopIndex2 !== -1) end = stopIndex2;

      return substring.slice(0, end).trim();
    };

    const summary = extractContent(
      text,
      "Holistic Summary",
      "Pathological Forecast",
      "Clinical Enablement",
    );
    const forecast = extractContent(
      text,
      "Pathological Forecast",
      "Clinical Enablement",
      null,
    );
    const enablement = extractContent(text, "Clinical Enablement", null, null);

    return { summary, forecast, enablement };
  }, [parsedActionPlan.clinicalReport]);

  const handlePrintClinicalReport = () => {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow popups to print.");
      return;
    }

    const mdToHtml = (md: string) => {
      if (!md) return "";
      return (
        "<p>" +
        md
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/- (.*?)(?:\n|$)/g, "<li>$1</li>")
          .replace(/\n\n/g, "</p><p>")
          .replace(/\n/g, "<br/>") +
        "</p>"
      );
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Clinical Holistic Report - AI Studio</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0 0 10px 0; color: #0f172a; }
          .meta { color: #64748b; font-size: 14px; }
          .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 20px; background: #f8fafc; }
          .card h2 { margin-top: 0; font-size: 18px; color: #0f172a; margin-bottom: 12px; }
          .card p, .card li { font-size: 14px; color: #334155; }
          .page-break { page-break-before: always; }
          h2.section-header { margin-top: 40px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
          .week-box { margin-bottom: 24px; }
          .week-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; }
          @media print { body { padding: 0; } .card { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Clinical Holistic Report & Forecast</h1>
          <div class="meta">
            Age ${age} &bull; ${gender} &bull; ${height}cm &bull; ${weight}kg &bull; BMI: ${bmi}<br/>
            Lifestyle: ${diet} Diet &bull; ${activityLevel} Activity<br/>
            Generated: ${new Date().toLocaleDateString()}
          </div>
        </div>

        ${
          parsedReportCards.summary
            ? `
          <div class="card"><h2>Holistic Summary</h2>${mdToHtml(parsedReportCards.summary)}</div>
          <div class="card"><h2>Pathological Forecast (1-5 Years)</h2>${mdToHtml(parsedReportCards.forecast)}</div>
          <div class="card"><h2>Clinical Enablement</h2>${mdToHtml(parsedReportCards.enablement)}</div>
        `
            : `
          <div class="card">${mdToHtml(parsedActionPlan.clinicalReport)}</div>
        `
        }

        <div class="page-break"></div>
        <h2 class="section-header">Patient 30-Day Reversal Journey</h2>
        ${parsedActionPlan.weeks
          .map(
            (w) => `
          <div class="week-box">
            <div class="week-title">${w.title}</div>
            ${mdToHtml(w.content)}
          </div>
        `,
          )
          .join("")}
      </body>
      </html>
    `;

    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 500);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [chatResetKey, setChatResetKey] = useState(0);

  const handleResetAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, "profiles", user.uid));
      await deleteDoc(doc(db, "simulations", user.uid));
      await deleteDoc(doc(db, "gamification", user.uid));

      const q = query(collection(db, "foodLogs"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();

      const mq = query(
        collection(db, "moodLogs"),
        where("uid", "==", user.uid),
      );
      const mSnapshot = await getDocs(mq);
      const mBatch = writeBatch(db);
      mSnapshot.forEach((d) => mBatch.delete(d.ref));
      await mBatch.commit();

      const bq = query(
        collection(db, "biomarkerLogs"),
        where("uid", "==", user.uid),
      );
      const bSnapshot = await getDocs(bq);
      const bBatch = writeBatch(db);
      bSnapshot.forEach((d) => bBatch.delete(d.ref));
      await bBatch.commit();

      setAge(35);
      setGender("Male");
      setHeight(175);
      setWeight(75);
      setActivityLevel("Moderate");
      setDiet("Average");
      setSmokingStatus("Never");
      setDiseaseConditions("");
      setStressLevel("Moderate");
      setSleepQuality("Average");
      setFaceImage(null);
      setSimulations([]);
      setOptimizedSimulations([]);
      setGeneratedImages({});
      setOptimizedImages(undefined);
      setFailedGenerations({});
      setFailedOptimized(false);
      setActionPlan(null);
      setFoodLogs([]);
      setMoodLogs([]);
      setBiomarkerLogs([]);
      setGamification(null);
      setHasNewFoodLog(false);
      setHasNewMoodLog(false);
      setChatResetKey((prev) => prev + 1);

      setShowResetConfirm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      let speechLang = "en-US";
      if (language === "Arabic") speechLang = "ar-SA";
      recognition.lang = speechLang;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setMealTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error in meal", event.error);
        setIsRecordingMeal(false);
      };

      recognition.onend = () => {
        setIsRecordingMeal(false);
      };

      mealRecognitionRef.current = recognition;
    }
  }, [language]);

  const toggleMealRecording = () => {
    if (isRecordingMeal) {
      mealRecognitionRef.current?.stop();
    } else {
      if (mealRecognitionRef.current) {
        setMealTranscript("");
        mealRecognitionRef.current.start();
        setIsRecordingMeal(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const handleAnalyzeMealText = async () => {
    if (!mealTranscript) return;
    setAnalyzingMeal(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const userProfileContext = `Age: ${age}, Gender: ${gender}, Weight: ${weight}kg, Height: ${height}cm, BMI: ${bmi}, Activity Level: ${activityLevel}, Diet Quality: ${diet}, Smoking Status: ${smokingStatus}, Medical Conditions: ${diseaseConditions || "None"}, Stress: ${stressLevel}, Sleep: ${sleepQuality}`;

      const prompt = `You are an expert nutritionist AI analyzing a meal for a holistic health progression app.
The user described their meal via voice input: "${mealTranscript}"

Their baseline holistic profile is:
"${userProfileContext}"

Analyze this meal description. Estimate its nutritional qualities and how it impacts their holistic health trend considering their baseline condition parameters like BMI, activity level, and medical conditions.
Add a suggestion on how to make this meal better (e.g. by adding, removing, or following it up with something, but not changing it completely).
CRITICAL INSTRUCTION: You MUST output all text strings in ${language}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            // @ts-ignore
            type: "OBJECT",
            properties: {
              foodName: {
                type: "STRING",
                description: `A short, descriptive name for the meal in ${language}`,
              },
              calories: {
                type: "NUMBER",
                description: "Total estimated calories as an integer",
              },
              healthScore: {
                type: "NUMBER",
                description:
                  "A number from 0 to 100 representing the healthiness of the meal based on the user's overall profile context. Not a 1-10 string.",
              },
              healthScoreExplanation: {
                type: "STRING",
                description: `A short sentence explaining what this specific health score means and why the meal received it relative to the user's profile in ${language}`,
              },
              improvementSuggestion: {
                type: "STRING",
                description: `A practical suggestion on how to make this specific meal slightly better based on their profile in ${language}`,
              },
              macros: {
                // @ts-ignore
                type: "OBJECT",
                properties: {
                  protein: {
                    type: "STRING",
                    description: "Estimated percentage string (e.g., '20%')",
                  },
                  carbs: {
                    type: "STRING",
                    description: "Estimated percentage string (e.g., '50%')",
                  },
                  fats: {
                    type: "STRING",
                    description: "Estimated percentage string (e.g., '30%')",
                  },
                },
                required: ["protein", "carbs", "fats"],
              },
              details: {
                type: "STRING",
                description: `A detailed description of the meal, explicitly identifying its contents and ingredients in ${language}`,
              },
              impactOnArteries: {
                type: "STRING",
                description: `Brief physical impact on arteries based on this meal + profile baseline in ${language}`,
              },
              impactOnHeart: {
                type: "STRING",
                description: `Brief physical impact on heart based on this meal + profile baseline in ${language}`,
              },
              impactOnBody: {
                type: "STRING",
                description: `Brief physical impact on body/weight based on this meal + profile baseline in ${language}`,
              },
            },
            required: [
              "foodName",
              "calories",
              "healthScore",
              "healthScoreExplanation",
              "improvementSuggestion",
              "macros",
              "details",
              "impactOnArteries",
              "impactOnHeart",
              "impactOnBody",
            ],
          },
        },
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (parsed) {
        if (!user) {
          throw new Error("Must be logged in to analyze meals");
        }
        if (isGuest) {
          alert(
            "Note: As a guest, your food logs will not be saved permanently. Please sign in to save your logs.",
          );
          return;
        }

        if (typeof parsed.healthScore === "string") {
          parsed.healthScore = parseInt(parsed.healthScore, 10);
        }
        if (isNaN(parsed.healthScore)) {
          parsed.healthScore = 50;
        }

        const newLogId = crypto.randomUUID();
        const newLog: FoodLog = {
          uid: user.uid,
          id: newLogId,
          foodName: parsed.foodName,
          date: mealDate
            ? new Date(mealDate).toISOString()
            : new Date().toISOString(),
          createdAt: new Date().toISOString(),
          analysis: parsed,
        };

        await setDoc(doc(db, "foodLogs", newLogId), newLog);

        setFoodLogs((prev) => [newLog, ...prev]);
        setHasNewFoodLog(true);
        setMealTranscript("");

        let reward = 0;
        let reason = "Meal Logged";
        if (parsed.healthScore > 80) {
          reward = 60;
          reason = "Exceptional Nutrition Logged";
        } else if (parsed.healthScore > 60) {
          reward = 30;
          reason = "Healthy Meal Logged";
        } else if (parsed.healthScore < 40) {
          reward = -30;
          reason = "Poor Nutrition Choice";
        }
        if (reward !== 0) earnHealthTime(reward, true, reason);
      } else {
        alert(
          t(
            "Failed to analyze meal. Please try again or provide a clearer description.",
          ),
        );
      }
    } catch (e) {
      console.error(e);
      alert(t("Failed to connect to the AI analyzer."));
    } finally {
      setAnalyzingMeal(false);
    }
  };

  const handleMealImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMealImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeMeal = async () => {
    if (!mealImage) return;
    setAnalyzingMeal(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const base64Data = mealImage.split(",")[1];
      const mimeType = mealImage.match(/data:(.*?);/)?.[1] || "image/jpeg";

      const userProfileContext = `Age: ${age}, Gender: ${gender}, Weight: ${weight}kg, Height: ${height}cm, BMI: ${bmi}, Activity Level: ${activityLevel}, Diet Quality: ${diet}, Smoking Status: ${smokingStatus}, Medical Conditions: ${diseaseConditions || "None"}, Stress: ${stressLevel}, Sleep: ${sleepQuality}`;

      const prompt = `You are an expert nutritionist AI analyzing a meal for a holistic health progression app.
The user uploaded an image or video of their meal. Their baseline holistic profile is:
"${userProfileContext}"
Analyze this food media. Estimate its nutritional qualities and how it impacts their holistic health trend considering their baseline condition parameters like BMI, activity level, and medical conditions.
Add a suggestion on how to make this meal better (e.g. by adding, removing, or following it up with something, but not changing it completely).
CRITICAL INSTRUCTION: You MUST output all text strings in ${language}.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            // @ts-ignore (we know Type.OBJECT or strict literal maps to standard JSON schema type)
            type: "OBJECT",
            properties: {
              foodName: {
                type: "STRING",
                description: `A short, descriptive name for the meal in ${language}`,
              },
              calories: {
                type: "NUMBER",
                description: "Total estimated calories as an integer",
              },
              healthScore: {
                type: "NUMBER",
                description:
                  "A number from 0 to 100 representing the healthiness of the meal based on the user's overall profile context (e.g., higher for nutrient-dense given their diet style/illness). Not a 1-10 string.",
              },
              healthScoreExplanation: {
                type: "STRING",
                description: `A short sentence explaining what this specific health score means and why the meal received it relative to the user's profile in ${language}`,
              },
              improvementSuggestion: {
                type: "STRING",
                description: `A practical suggestion on how to make this specific meal slightly better based on their profile in ${language}`,
              },
              macros: {
                // @ts-ignore
                type: "OBJECT",
                properties: {
                  protein: {
                    type: "STRING",
                    description: "Estimated percentage string (e.g., '20%')",
                  },
                  carbs: {
                    type: "STRING",
                    description: "Estimated percentage string (e.g., '50%')",
                  },
                  fats: {
                    type: "STRING",
                    description: "Estimated percentage string (e.g., '30%')",
                  },
                },
                required: ["protein", "carbs", "fats"],
              },
              details: {
                type: "STRING",
                description: `A detailed description of the meal, explicitly identifying its contents and ingredients in ${language}`,
              },
              impactOnArteries: {
                type: "STRING",
                description: `Brief physical impact on arteries based on this meal + profile baseline in ${language}`,
              },
              impactOnHeart: {
                type: "STRING",
                description: `Brief physical impact on heart based on this meal + profile baseline in ${language}`,
              },
              impactOnBody: {
                type: "STRING",
                description: `Brief physical impact on body/weight based on this meal + profile baseline in ${language}`,
              },
            },
            required: [
              "foodName",
              "calories",
              "healthScore",
              "healthScoreExplanation",
              "improvementSuggestion",
              "macros",
              "details",
              "impactOnArteries",
              "impactOnHeart",
              "impactOnBody",
            ],
          },
        },
      });

      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (parsed) {
        if (!user) {
          throw new Error("Must be logged in to analyze meals");
        }
        if (isGuest) {
          alert(
            "Note: As a guest, your food logs will not be saved permanently. Please sign in to save your logs.",
          );
          return;
        }

        // Ensure healthScore is a number
        if (typeof parsed.healthScore === "string") {
          parsed.healthScore = parseInt(parsed.healthScore, 10);
        }
        if (isNaN(parsed.healthScore)) {
          parsed.healthScore = 50;
        }

        const newLogId = crypto.randomUUID();
        let finalImageUrl = "";

        try {
          if (mealImage && storage) {
            const imageRef = ref(storage, `foodImages/${user.uid}/${newLogId}`);
            await uploadString(imageRef, mealImage, "data_url");
            finalImageUrl = await getDownloadURL(imageRef);
          } else if (mealImage && !storage) {
            finalImageUrl = mealImage.length > 1000000 ? "" : mealImage;
          }
        } catch (uploadError) {
          console.error(
            "Failed to upload image to storage, storing without image:",
            uploadError,
          );
        }

        const newLog = {
          id: newLogId,
          uid: user.uid,
          foodName: parsed.foodName || "Scanned Meal",
          date: mealDate,
          imageUrl: finalImageUrl,
          analysis: parsed,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, "foodLogs", newLogId), newLog);

        setHasNewFoodLog(true);
        setMealImage(null);
        setMealDate(
          new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16),
        );

        let reward = 0;
        let reason = "Meal Logged";
        if (parsed.healthScore > 80) {
          reward = 60;
          reason = "Exceptional Nutrition Logged";
        } else if (parsed.healthScore > 60) {
          reward = 30;
          reason = "Healthy Meal Logged";
        } else if (parsed.healthScore < 40) {
          reward = -30;
          reason = "Poor Nutrition Choice";
        }
        if (reward !== 0) earnHealthTime(reward, true, reason);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to analyze meal. See console.");
    } finally {
      setAnalyzingMeal(false);
    }
  };

  const getImpactSuggestion = () => {
    if (smokingStatus === "Current") {
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-white/60 p-4 rounded-xl border border-green-100">
            <div className="bg-[#9081B1]/20 p-2 rounded-lg">
              <CigaretteOff className="w-5 h-5 text-[#3D2B56]" />
            </div>
            <div>
              <h5 className="font-bold text-black">Quit Smoking Today</h5>
              <p className="text-sm text-black/80 mt-1">
                Your smoking status is the #1 contributor to artery degradation.
                Quitting would immediately halt the chemical damage to your
                vessel walls.
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-black bg-[#9081B1]/10 p-3 rounded-lg border border-[#9081B1]/30">
            <strong className="text-black font-semibold">Why it works:</strong>{" "}
            Within just 1 year of quitting, your added risk of coronary heart
            disease drops to half that of a smoker's.
          </p>
        </div>
      );
    }
    if (diet === "Poor") {
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-white/60 p-4 rounded-xl border border-green-100">
            <div className="bg-[#9081B1]/20 p-2 rounded-lg">
              <Apple className="w-5 h-5 text-[#3D2B56]" />
            </div>
            <div>
              <h5 className="font-bold text-black">Upgrade Your Diet</h5>
              <p className="text-sm text-black/80 mt-1">
                Shift towards an 'Average' or 'Excellent' diet by swapping
                refined sugars and trans fats for fiber and omega-3s.
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-black bg-[#9081B1]/10 p-3 rounded-lg border border-[#9081B1]/30">
            <strong className="text-black font-semibold">Why it works:</strong>{" "}
            Fiber acts like a sponge, soaking up bad cholesterol before it can
            stick to your artery walls, drastically lowering heart stress.
          </p>
        </div>
      );
    }
    if (activityLevel === "Sedentary") {
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-white/60 p-4 rounded-xl border border-green-100">
            <div className="bg-[#9081B1]/20 p-2 rounded-lg">
              <Footprints className="w-5 h-5 text-[#3D2B56]" />
            </div>
            <div>
              <h5 className="font-bold text-black">Start Moving Daily</h5>
              <p className="text-sm text-black/80 mt-1">
                Add just 150 minutes of moderate activity per week (like a brisk
                20-minute walk each day).
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-black bg-[#9081B1]/10 p-3 rounded-lg border border-[#9081B1]/30">
            <strong className="text-black font-semibold">Why it works:</strong>{" "}
            Cardio exercise trains your heart to pump more blood with less
            effort, lowering your resting heart rate and blood pressure.
          </p>
        </div>
      );
    }
    if (parseFloat(bmi) > 25) {
      return (
        <div className="space-y-4">
          <div className="flex items-start space-x-3 bg-white/60 p-4 rounded-xl border border-green-100">
            <div className="bg-[#9081B1]/20 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-[#3D2B56]" />
            </div>
            <div>
              <h5 className="font-bold text-black">
                Target a 5% Weight Reduction
              </h5>
              <p className="text-sm text-black/80 mt-1">
                A slight reduction in weight can exponentially decrease the
                mechanical stress on your heart.
              </p>
            </div>
          </div>
          <p className="text-sm font-medium text-black bg-[#9081B1]/10 p-3 rounded-lg border border-[#9081B1]/30">
            <strong className="text-black font-semibold">Why it works:</strong>{" "}
            Losing just 5-10% of your body weight significantly improves blood
            flow and reduces the strain on your cardiovascular system.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex items-start space-x-3 bg-white/60 p-4 rounded-xl border border-green-100">
          <div className="bg-[#9081B1]/20 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-[#3D2B56]" />
          </div>
          <div>
            <h5 className="font-bold text-black">Maintain Your Routine</h5>
            <p className="text-sm text-black/80 mt-1">
              You're doing great! Keep up your current healthy habits to ensure
              your heart and arteries remain in excellent condition.
            </p>
          </div>
        </div>
        <p className="text-sm font-medium text-black bg-[#9081B1]/10 p-3 rounded-lg border border-[#9081B1]/30">
          <strong className="text-black font-semibold">Why it works:</strong>{" "}
          Consistency is key. Long-term adherence to a healthy lifestyle
          prevents the age-related stiffening of arteries.
        </p>
      </div>
    );
  };

  const getScienceContext = () => {
    if (smokingStatus === "Current" && diet === "Poor") {
      return (
        <div className="space-y-3">
          <p>
            <strong>The "Sandpaper & Spackle" Effect:</strong> Smoking acts like
            sandpaper on the inner lining of your blood vessels (the
            endothelium), creating tiny scratches and inflammation. A poor diet,
            high in bad cholesterol, acts like spackle that fills in those
            scratches.
          </p>
          <p>
            Over time, this 'spackle' hardens into dangerous plaque, narrowing
            the pipes and forcing your heart to pump much harder to get blood
            through. This synergistic effect drastically accelerates
            cardiovascular aging.
          </p>
        </div>
      );
    } else if (smokingStatus === "Current") {
      return (
        <div className="space-y-3">
          <p>
            <strong>Endothelial Dysfunction:</strong> Smoking introduces toxins
            that damage the endothelium—the delicate inner lining of your blood
            vessels. Think of it like a non-stick pan losing its coating.
          </p>
          <p>
            Without this smooth lining, your arteries become stiff and sticky,
            making them highly prone to plaque accumulation. This restricts
            blood flow and forces your heart to work overtime, even while
            resting.
          </p>
        </div>
      );
    } else if (diet === "Poor" && activityLevel === "Sedentary") {
      return (
        <div className="space-y-3">
          <p>
            <strong>The Metabolic Traffic Jam:</strong> A sedentary lifestyle
            combined with a poor diet means excess calories and cholesterol are
            constantly entering your bloodstream without being burned off.
          </p>
          <p>
            This creates a "traffic jam" in your arteries. Excess fats are
            stored as plaque, and because your heart muscle isn't getting the
            exercise it needs to stay strong, it becomes less efficient at
            pumping blood through these narrowing pathways.
          </p>
        </div>
      );
    } else if (parseFloat(bmi) > 30) {
      return (
        <div className="space-y-3">
          <p>
            <strong>Increased Mechanical Load:</strong> Higher body mass
            requires your heart to pump harder and further to supply oxygenated
            blood to all your tissues. Imagine trying to pump water through a
            much longer, wider hose.
          </p>
          <p>
            Over time, this constant extra effort can lead to a thickening of
            the heart muscle (hypertrophy). While a thicker muscle sounds good
            for biceps, a thicker heart becomes stiff and less efficient at
            filling with blood.
          </p>
        </div>
      );
    } else {
      return (
        <div className="space-y-3">
          <p>
            <strong>The Power of Prevention:</strong> Your healthy lifestyle
            choices directly protect your endothelial function (how well your
            blood vessels expand and contract) and your myocardial efficiency
            (how well your heart pumps).
          </p>
          <p>
            By keeping inflammation low and your heart muscle conditioned, you
            are actively preventing the stiffening of arteries and the buildup
            of plaque that typically occurs with aging.
          </p>
        </div>
      );
    }
  };

  const handleGenerateHcpReport = async () => {
    setGeneratingHcp(true);
    try {
      const recentFood = foodLogs
        .slice(0, 30)
        .map((f) => `Food: ${f.foodName}, Score: ${f.analysis?.healthScore}`)
        .join(";");
      const recentMood = moodLogs
        .slice(0, 30)
        .map((m) => `Stress: ${m.stressLevel}/10, Sleep: ${m.sleepHours}h`)
        .join(";");
      const biomarkersStr = [
        totalCholesterol ? `Cholesterol: ${totalCholesterol}` : "",
        ldl ? `LDL: ${ldl}` : "",
        hdl ? `HDL: ${hdl}` : "",
        bloodPressureSystolic
          ? `BP: ${bloodPressureSystolic}/${bloodPressureDiastolic}`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      const patientProfileStr = `Age: ${age}, Gender: ${gender}, Weight: ${weight}kg, Activity: ${activityLevel}, Diet: ${diet}, Conditions: ${diseaseConditions || "None"}`;

      const report = await generateHCPReport(
        patientProfileStr,
        recentFood || "No food logged.",
        recentMood || "No mood logged.",
        biomarkersStr || "No biomarkers logged.",
        actionPlan || "No action plan enrolled yet.",
      );
      setHcpReport(report);
      setShowHcpModal(true);
      if (user) {
        setDoc(
          doc(db, "profiles", user.uid),
          { hcpReport: report },
          { merge: true },
        );
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate HCP report");
    } finally {
      setGeneratingHcp(false);
    }
  };

  const handleGenerateActionPlan = async () => {
    setLoadingActionPlan(true);
    setActiveWeek(0);
    try {
      const recentFood = foodLogs
        .slice(0, 10)
        .map((f) => `Food: ${f.foodName}, Cals: ${f.analysis?.calories}`)
        .join("; ");
      const recentMood = moodLogs
        .slice(0, 10)
        .map(
          (m) =>
            `Mood: ${m.intensity}/10, Stress: ${m.stressLevel}/10, Triggers: ${m.triggers?.join(", ") || "None"}`,
        )
        .join("; ");
      const logsContext = `Recent Diet: ${recentFood}\nRecent Somatic/Mood: ${recentMood}`;

      const biomarkersStr = [
        totalCholesterol ? `Total Cholesterol: ${totalCholesterol} mg/dL` : "",
        ldl ? `LDL: ${ldl} mg/dL` : "",
        hdl ? `HDL: ${hdl} mg/dL` : "",
        lpa ? `Lp(a): ${lpa} mg/dL` : "",
        randomGlucose ? `Random Glucose: ${randomGlucose} mg/dL` : "",
        hba1c ? `HbA1c: ${hba1c} %` : "",
        bloodPressureSystolic && bloodPressureDiastolic
          ? `Blood Pressure: ${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      const plan = await generateActionPlan(
        age,
        gender,
        height,
        weight,
        bmi,
        activityLevel,
        diet,
        smokingStatus,
        diseaseConditions,
        stressLevel,
        sleepQuality,
        logsContext,
        biomarkersStr || undefined,
        language,
      );
      if (user) {
        await setDoc(
          doc(db, "simulations", user.uid),
          {
            uid: user.uid,
            actionPlan: plan,
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }
      setActionPlan(plan);
    } catch (error) {
      console.error("Failed to generate action plan", error);
    } finally {
      setLoadingActionPlan(false);
    }
  };

  const seenNames = new Set<string>();
  const chartData = simulations.map((sim, index) => {
    const optSim = optimizedSimulations.find(
      (o) => o.timeframe === sim.timeframe,
    );
    let finalName = sim.timeframe || `Step ${index}`;
    if (seenNames.has(finalName)) {
      finalName = `${finalName} (*)`;
    }
    seenNames.add(finalName);
    return {
      name: finalName,
      "Current Trajectory": sim.overallRisk,
      "Optimized Trajectory": optSim ? optSim.overallRisk : 0,
    };
  });

  const handleSimulate = async () => {
    setActiveTab("timeline");
    currentRunId.current += 1;
    const runId = currentRunId.current;

    setLoading(true);
    setAvatarDescription(null);
    setActionPlan(null);
    setHasNewFoodLog(false);
    setFailedGenerations({});
    setFailedOptimized(false);
    setGeneratedImages({});
    setOptimizedImages(null);
    try {
      const foodTrendSummary =
        foodLogs.length > 0
          ? `Average Health Score: ${Math.round(foodLogs.reduce((acc, log) => acc + log.analysis.healthScore, 0) / foodLogs.length)}/100 across ${foodLogs.length} recent meals. Latest impacts recorded on the body/arteries/heart.`
          : undefined;

      const moodTrendSummary =
        moodLogs.length > 0
          ? `Average Stress Level: ${Math.round(moodLogs.reduce((acc, log) => acc + log.stressLevel, 0) / moodLogs.length)}/10. Average Sleep: ${Math.round(moodLogs.reduce((acc, log) => acc + log.sleepHours, 0) / moodLogs.length)} hrs. Recent emotional pattern: ${moodLogs[0]?.analysis?.emotionalPattern || moodLogs[0].emoji}.`
          : undefined;

      const biomarkersStr = [
        totalCholesterol ? `Total Cholesterol: ${totalCholesterol} mg/dL` : "",
        ldl ? `LDL: ${ldl} mg/dL` : "",
        hdl ? `HDL: ${hdl} mg/dL` : "",
        lpa ? `Lp(a): ${lpa} mg/dL` : "",
        randomGlucose ? `Random Glucose: ${randomGlucose} mg/dL` : "",
        hba1c ? `HbA1c: ${hba1c} %` : "",
        bloodPressureSystolic && bloodPressureDiastolic
          ? `Blood Pressure: ${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg`
          : "",
      ]
        .filter(Boolean)
        .join(", ");

      const { current: results, optimized: optResults } =
        await generateCombinedHealthSimulation(
          age,
          gender,
          height,
          weight,
          bmi,
          activityLevel,
          diet,
          smokingStatus,
          diseaseConditions,
          stressLevel,
          sleepQuality,
          foodTrendSummary,
          moodTrendSummary,
          biomarkersStr || undefined,
          language,
        );

      setGeneratedImages({}); // Reset images on new simulation
      if (user) {
        await setDoc(
          doc(db, "simulations", user.uid),
          {
            uid: user.uid,
            simulationsJson: JSON.stringify(results),
            optimizedSimulationsJson: JSON.stringify(optResults),
            generatedImagesJson: "{}",
            optimizedImagesJson: "{}",
            createdAt: new Date().toISOString(),
          },
          { merge: true },
        );
      }
      setSimulations(results);
      setOptimizedSimulations(optResults);

      // KICK OFF SEQUENTIAL GENERATION WITHOUT BLOCKING - Always pass an empty object here when updating manually to force regeneration
      startSequentialGeneration(
        results,
        optResults,
        age,
        gender,
        height,
        weight,
        bmi,
        activityLevel,
        diet,
        {},
      ).catch(console.error);
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateFailedImages = () => {
    setFailedGenerations({});
    setFailedOptimized(false);
    generationInProgress.current = false;
    startSequentialGeneration(
      simulations,
      optimizedSimulations,
      age,
      gender,
      height,
      weight,
      bmi,
      activityLevel,
      diet,
      generatedImages,
      true,
    ).catch(console.error);
  };

  const startSequentialGeneration = async (
    results: HealthSimulation[],
    optResults: HealthSimulation[],
    startAge: number,
    startGender: string,
    startHeight: number,
    startWeight: number,
    startBmi: string,
    startActivityLevel: string,
    startDiet: string,
    existingImages: Record<string, any> = {},
    ignoreFailures: boolean = false,
  ) => {
    if (generationInProgress.current) return;
    generationInProgress.current = true;

    try {
      let currentAvatarDesc = avatarDescription;
      if (imageStyle === "avatar" && !currentAvatarDesc) {
        currentAvatarDesc = await extractAvatarDescription(
          startAge,
          startGender,
          startHeight,
          startWeight,
          startBmi,
          faceImage || undefined,
        );
        setAvatarDescription(currentAvatarDesc);
      }

      let currentReferenceImages: any = undefined;
      let prevSimAge: number | undefined = undefined;
      let currentGeneratedImagesAccumulator = { ...existingImages };
      let sequenceFailed = false;

      for (const sim of results) {
        if (
          currentGeneratedImagesAccumulator[sim.timeframe] &&
          currentGeneratedImagesAccumulator[sim.timeframe].body
        ) {
          // If we hit an existing generated column, we MUST pull those raw Firestore URLs through the active CORS proxy
          // before caching them to currentReferenceImages, otherwise the loop will inject bad cross-origin links into the model
          const tfObj = currentGeneratedImagesAccumulator[sim.timeframe];
          currentReferenceImages = {
            body: tfObj.body || null,
            heart: tfObj.heart || null,
            arteries: tfObj.arteries || null,
            brain: tfObj.brain || null,
          };
          const getYears = (tf: string) =>
            tf === "Now" ? 0 : parseInt(tf.split(" ")[0]) || 0;
          prevSimAge = startAge + getYears(sim.timeframe);
          continue;
        }

        if (
          sequenceFailed ||
          (!ignoreFailures && failedGenerations[sim.timeframe])
        ) {
          continue; // Stop the chain if a dependency failed, to prevent bad reference images
        }

        setGeneratingImages((prev) => ({ ...prev, [sim.timeframe]: true }));
        console.log(`[Sequencer] Generating timeframe: ${sim.timeframe}`);

        const getYears = (tf: string) =>
          tf === "Now" ? 0 : parseInt(tf.split(" ")[0]) || 0;
        const simAge = startAge + getYears(sim.timeframe);

        const generatedForSim = await handleGenerateImages(
          sim,
          startAge,
          startGender,
          startHeight,
          startWeight,
          startBmi,
          startDiet,
          startActivityLevel,
          currentReferenceImages,
          faceImage,
          false,
          prevSimAge,
          currentAvatarDesc,
        );

        if (
          generatedForSim &&
          Object.keys(generatedForSim).length > 0 &&
          generatedForSim.body
        ) {
          // We do NOT save generatedForSim to accumulators because it contains RAW Base64 strings,
          // and we explicitly updated handleGenerateImages to write URL strings to Firestore and UI State internally.
          // We merely pass the raw Base64 sequentially strictly into the loop variable for the next pass
          currentReferenceImages = generatedForSim;
          prevSimAge = simAge;
        } else {
          sequenceFailed = true;
          setFailedGenerations((prev) => ({ ...prev, [sim.timeframe]: true }));
        }
        setGeneratingImages((prev) => ({ ...prev, [sim.timeframe]: false }));
      }

      // Now optimized comparison
      const opt10Year = optResults.find((s) => s.timeframe === "10 Years");
      if (
        opt10Year &&
        (!optimizedImages || Object.keys(optimizedImages).length === 0) &&
        (ignoreFailures || !failedOptimized)
      ) {
        setGeneratingOptimizedImage(true);
        console.log(`[Sequencer] Generating timeframe: Optimized 10 Years`);
        const optImages = await handleGenerateImages(
          opt10Year,
          startAge,
          startGender,
          startHeight,
          startWeight * 0.9,
          startBmi,
          "Excellent",
          "Active",
          undefined,
          faceImage,
          true,
          startAge + 10,
          currentAvatarDesc,
        );
        if (
          !optImages ||
          Object.keys(optImages).length === 0 ||
          !optImages.body
        ) {
          setFailedOptimized(true);
        }
        setGeneratingOptimizedImage(false);
      }
    } finally {
      generationInProgress.current = false;
    }
  };

  const handleGenerateImages = async (
    sim: HealthSimulation,
    currentAge: number,
    currentGender: string,
    currentHeight: number,
    currentWeight: number,
    currentBmi: string,
    currentDiet: string,
    currentActivity: string,
    referenceImages?: {
      body: string | null;
      heart: string | null;
      arteries: string | null;
      brain: string | null;
    },
    faceImage?: string | null,
    isOptimized: boolean = false,
    referenceAge?: number,
    avatarDesc?: string | null,
  ) => {
    if (!isOptimized) {
      setGeneratingImages((prev) => ({ ...prev, [sim.timeframe]: true }));
    }
    try {
      const getYears = (tf: string) => {
        if (tf === "Now") return 0;
        return parseInt(tf.split(" ")[0]) || 0;
      };
      const simAge = currentAge + getYears(sim.timeframe);
      const yearsElapsed = simAge - currentAge; // Always compare against the original photo age to stop mutation drift

      // Calculate Biological Age based on lifestyle factors
      let bioAgeModifier = 0;
      if (isOptimized) {
        bioAgeModifier = -4; // Excellent diet + Active lifestyle
      } else {
        if (currentDiet === "Poor") bioAgeModifier += 2;
        if (currentDiet === "Excellent") bioAgeModifier -= 2;
        if (currentActivity === "Sedentary") bioAgeModifier += 2;
        if (currentActivity === "Active") bioAgeModifier -= 2;
        if (smokingStatus === "Current") bioAgeModifier += 5;
        if (smokingStatus === "Former") bioAgeModifier += 2;
        if (parseFloat(currentBmi) > 30) bioAgeModifier += 3;
        else if (parseFloat(currentBmi) > 25) bioAgeModifier += 1;
      }
      const biologicalAge = Math.max(18, simAge + bioAgeModifier);

      // Determine Glogau Wrinkle Scale based on Biological Age
      let glogauScale = "Type I (No wrinkles, early photoaging)";
      if (biologicalAge >= 35 && biologicalAge < 50)
        glogauScale =
          "Type II (Wrinkles in motion, early to moderate photoaging)";
      if (biologicalAge >= 50 && biologicalAge < 65)
        glogauScale = "Type III (Wrinkles at rest, advanced photoaging)";
      if (biologicalAge >= 65)
        glogauScale = "Type IV (Only wrinkles, severe photoaging)";

      const userSummary = `Chronological Age: ${simAge}, Biological Age: ${biologicalAge}, Gender: ${currentGender}, Height: ${currentHeight}cm, Weight: ${currentWeight}kg, BMI: ${currentBmi}, Diet: ${currentDiet}, Activity: ${currentActivity}, Smoking: ${isOptimized ? "Never" : smokingStatus}, Conditions: ${diseaseConditions || "None"}`;

      const clinicalConstraints = `CRITICAL AGING CONSTRAINTS: Base the physical appearance strictly on the Biological Age (${biologicalAge}) using the Glogau Wrinkle Scale: ${glogauScale}. DO NOT exaggerate aging. Apply subtle, realistic micro-aging. For healthy biological ages, strictly preserve skin elasticity, youthful volume, and natural hair color. Do not add deep wrinkles, sagging, or gray hair unless the biological age is over 50. IMPORTANT CONSTRAINT: If the feet are visible in the image, they MUST be completely bare and exposed barefoot (no shoes, no socks, no footwear).`;

      const agingTextBody =
        yearsElapsed > 0
          ? `The provided reference image is of the user at age ${currentAge}. Edit this image to age them by ${yearsElapsed} years and show them FULL-BODY at chronological age ${simAge} (Biological Age: ${biologicalAge}).`
          : `Edit this image to show the individual FULL-BODY at chronological age ${simAge} (Biological Age: ${biologicalAge}).`;

      const agingTextMedical =
        referenceAge !== undefined && simAge > referenceAge
          ? `The provided reference image is from ${simAge - referenceAge} years ago. Edit this image to show the progression over ${simAge - referenceAge} years.`
          : `Edit this image to reflect the current state.`;

      let finalBodyPrompt = faceImage
        ? `${agingTextBody} Avatar state: ${sim.avatarState}. Lifestyle: ${currentDiet} diet, ${currentActivity}, Conditions: ${diseaseConditions || "None"}. Show the physical effects of their lifestyle and conditions. You must render a FULL BODY view (standing, front or 45 degree angle) tracking from head to toe. They must be wearing ${outfit}. CRITICAL MEDICAL REQUIREMENT: You MUST render parts of the skin/body as transparent or "x-ray" style to clearly reveal internal systems, organs, or anatomical structures that have abnormalities, diseases, or damage related to their conditions. If there are visible skin conditions, render them prominently on the visible skin surface. Include 3-5 clear text labels pointing to specific areas. Include a summary of user info: ${userSummary}. ${clinicalConstraints} CRITICAL: MUST maintain the EXACT SAME facial features, ethnicity, base identity, and skin tone as the provided reference image. CRITICAL: All text labels in the image MUST be written in ${language}. Clean white background.`
        : `A highly consistent, hyper-realistic medical-style full body illustration of a ${currentGender} individual. Currently chronological age ${simAge} (Biological Age: ${biologicalAge}), ${currentHeight}cm tall, weighing ${currentWeight}kg (BMI: ${currentBmi}). Lifestyle: ${currentDiet} diet, ${currentActivity}, Conditions: ${diseaseConditions || "None"}. Avatar state: ${sim.avatarState}. Show the physical effects of their lifestyle and conditions. MUST be in a standing, flat-arms position, wearing ${outfit}. CRITICAL MEDICAL REQUIREMENT: You MUST render parts of the skin/body as transparent or "x-ray" style to clearly reveal internal systems, organs, or anatomical structures that have abnormalities, diseases, or damage related to their conditions. If there are visible skin conditions, render them prominently on the visible skin surface. Include 3-5 clear text labels pointing to specific areas to help a novice user understand the conditions or abnormalities shown. Include a summary of user info: ${userSummary}. ${clinicalConstraints} CRITICAL: All text labels in the image MUST be written in ${language}. Clean white background.`;

      let finalBodyReference = faceImage || undefined;

      if (imageStyle === "avatar") {
        const agingTextAvatar =
          yearsElapsed > 0
            ? `The provided reference image is of the avatar at younger age. Edit this reference image to age them by ${yearsElapsed} years to reach chronological age ${simAge} (Biological age: ${biologicalAge}).`
            : `Create the initial avatar image representing chronological age ${simAge} (Biological age: ${biologicalAge}).`;

        finalBodyPrompt = `A high-quality 3D digital realistic avatar illustration. ${avatarDesc ? "Base Avatar Visual Description: " + avatarDesc + "." : ""} ${agingTextAvatar} Current Health State: ${sim.avatarState}. Lifestyle: ${currentDiet} diet, ${currentActivity}, Conditions: ${diseaseConditions || "None"}. Render a FULL BODY perspective (standing from head to toe). They must be wearing ${outfit}. Show the physical effects of their lifestyle and conditions. CRITICAL MEDICAL REQUIREMENT: You MUST render parts of the avatar's skin/body as transparent or "glass-like" to clearly reveal internal systems, organs, or anatomical structures that have abnormalities, diseases, or damage related to their conditions. If there are visible skin conditions, render them prominently on the visible skin surface. Include 3-5 clear text labels pointing to specific areas. Include a summary of user info: ${userSummary}. ${clinicalConstraints} CRITICAL: All text labels MUST be written in ${language}. Clean white background.`;

        finalBodyReference = referenceImages?.body || undefined;
      }

      const arteriesPrompt = referenceImages?.arteries
        ? `${agingTextMedical} Reflect a health score of ${sim.arteryHealth}/100. Plaque/blood flow: ${sim.explanation}. Include 3-5 clear text labels in ${language} pointing to specific areas to help a novice user understand the conditions or abnormalities shown. MUST maintain the exact same cross-section angle, lighting, illustration style, and zoom level. Clean white background.`
        : `A highly consistent, hyper-realistic medical cross-section illustration of a human artery. Health score: ${sim.arteryHealth}/100. Plaque/blood flow: ${sim.explanation}. Include 3-5 clear text labels in ${language} pointing to specific areas to help a novice user understand the conditions or abnormalities shown. Clean white background.`;

      // We use Promise.all to run all organs in parallel.
      const [body, arteries] = await Promise.all([
        generateHealthImage(finalBodyPrompt, finalBodyReference),
        generateHealthImage(
          arteriesPrompt,
          referenceImages?.arteries || undefined,
        ),
      ]);

      const uploadAndGetUrl = async (
        base64Img: string | null,
        organ: string,
      ) => {
        if (!base64Img || !user) return { url: base64Img, base64: base64Img }; // Return original if null/not logged in
        if (!base64Img.startsWith("data:"))
          return { url: base64Img, base64: base64Img }; // Likely already a URL
        if (!storage) throw new Error("Firebase Storage is not initialized.");

        try {
          const timestamp = Date.now().toString();
          const p = isOptimized ? "opti" : "sim";
          const imageRef = ref(
            storage,
            `simImages/${user.uid}/${sim.timeframe.replace(/ /g, "_")}_${organ}_${p}_${timestamp}`,
          );
          await uploadString(imageRef, base64Img, "data_url");
          return { url: await getDownloadURL(imageRef), base64: base64Img };
        } catch (err) {
          console.error(
            `Firebase Storage Error [simImages]: Missing or insufficient permissions. You MUST update your Storage Rules in the Firebase Console!`,
            err,
          );
          throw err;
        }
      };

      const [bodyResult, arteriesResult] = await Promise.all([
        uploadAndGetUrl(body, "body"),
        uploadAndGetUrl(arteries, "arteries"),
      ]);

      const urlObj = {
        body: bodyResult.url,
        heart: null,
        arteries: arteriesResult.url,
        brain: null,
      };

      if (!isOptimized) {
        setGeneratedImages((prev) => {
          const newImages = {
            ...prev,
            [sim.timeframe]: urlObj,
          };
          if (user) {
            setDoc(
              doc(db, "simulations", user.uid),
              {
                generatedImagesJson: JSON.stringify(newImages),
              },
              { merge: true },
            ).catch((e) => console.error("Failed to save image links:", e));
          }
          return newImages;
        });
      } else {
        setOptimizedImages(urlObj);
        if (user) {
          setDoc(
            doc(db, "simulations", user.uid),
            {
              optimizedImagesJson: JSON.stringify(urlObj),
            },
            { merge: true },
          ).catch((e) =>
            console.error("Failed to save optimized image links:", e),
          );
        }
      }

      // We explicitly return the BASE64 string back to the Sequence loop
      // so the next iteration doesn't mathematically suffer from Firebase CORS fetch blocks
      // because it stays entirely in local memory!
      return {
        body: bodyResult.base64,
        heart: null,
        arteries: arteriesResult.base64,
        brain: null,
      };
    } catch (error) {
      console.error("Failed to generate images", error);
      return { body: null, heart: null, arteries: null, brain: null };
    } finally {
      if (!isOptimized) {
        setGeneratingImages((prev) => ({ ...prev, [sim.timeframe]: false }));
      }
    }
  };

  const isTimelineImagesReady = !!(
    generatedImages["Now"]?.body &&
    generatedImages[selectedFuture]?.body &&
    !generatingImages["Now"] &&
    !generatingImages[selectedFuture]
  );

  const isTakeControlReady = !!(
    generatedImages[selectedFuture]?.body &&
    optimizedImages?.body &&
    !generatingImages[selectedFuture] &&
    !generatingOptimizedImage
  );

  useEffect(() => {
    if (isTimelineImagesReady && !timelineReadyTriggered.current) {
      timelineReadyTriggered.current = true;
      setShowTimelineToast(true);
      setTimeout(() => setShowTimelineToast(false), 5000);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Timeline Ready!", { body: "Your visual timeline comparing your current and past self is ready.", icon: "/vite.svg" });
      }
    }
  }, [isTimelineImagesReady]);

  useEffect(() => {
    if (isTakeControlReady && !takeControlReadyTriggered.current) {
      takeControlReadyTriggered.current = true;
      setShowTakeControlToast(true);
      setTimeout(() => setShowTakeControlToast(false), 5000);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Optimized Future Ready!", { body: "Your 'Take Control of Your Future' optimized simulation is ready.", icon: "/vite.svg" });
      }
    }
  }, [isTakeControlReady]);

  if (!hasApiKey) {
    return <ApiKeySetup onComplete={() => setHasApiKey(true)} />;
  }

  const healthyFoodLogsCount = foodLogs.filter(
    (log) => log.analysis && log.analysis.healthScore > 75,
  ).length;
  const lowStressLogsCount = moodLogs.filter(
    (log) => log.stressLevel < 5,
  ).length;
  const vitalityStreakCount = gamification?.vitalityStreak || 0;

  return (
    <TooltipProvider>
      <OnboardingSlideshow isReady={!showPocModal} />
      <div className="min-h-screen bg-slate-50 text-black font-sans pb-32 md:p-8 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {authError && (
            <div
              className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between"
              role="alert"
            >
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold">Authentication Notice</p>
                  <p>{authError}</p>
                </div>
              </div>
              {needsDirectLogin && (
                <Button
                  onClick={() => forceLogin()}
                  className="mt-4 md:mt-0 bg-amber-600 hover:bg-amber-700 text-white border border-slate-200 rounded-lg whitespace-nowrap lg:ml-6"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Force Login
                </Button>
              )}
            </div>
          )}

          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center flex flex-col items-center space-y-4 relative md:space-y-6"
          >
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:absolute md:top-0 md:right-0 z-20">
              <Select
                value={language}
                onValueChange={(val: any) => setLanguage(val)}
              >
                <SelectTrigger className="w-[120px] h-9 bg-white/80 border-slate-300 rounded-full text-xs">
                  <Globe className="w-3 h-3 mr-1 text-slate-500" />
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* GAMIFICATION STATS */}
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <>
                  {isGuest ? (
                    <div
                      className="flex items-center space-x-1.5 md:space-x-2 bg-slate-200/50 px-2 md:px-3 py-1.5 rounded-full border border-slate-300"
                      title="You are exploring as a temporary guest"
                    >
                      {faceImage ? (
                        <img
                          src={faceImage || undefined}
                          alt="User Avatar"
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover border-2 border-white"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <User className="w-4 h-4 text-slate-500" />
                      )}
                      <span className="text-xs md:text-sm font-medium text-slate-600 hidden sm:inline-block">
                        {t("Profile Active")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 md:space-x-2 bg-green-100/60 px-2 md:px-3 py-1.5 rounded-full border border-green-200">
                      {faceImage ? (
                        <img
                          src={faceImage || undefined}
                          alt="User Profile"
                          className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover border-2 border-white"
                          crossOrigin="anonymous"
                        />
                      ) : user?.photoURL ? (
                        <img
                          src={user.photoURL || undefined}
                          alt="Google Avatar"
                          className="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                      <span
                        className="text-xs md:text-sm font-medium text-green-800"
                        title={user?.email || "User"}
                      >
                        <span className="hidden sm:inline">
                          {user?.email || user?.displayName || t("Logged In")}
                        </span>
                        <span className="sm:hidden">
                          {user?.displayName?.split(" ")[0] ||
                            user?.email?.split("@")[0] ||
                            t("Logged In")}
                        </span>
                      </span>
                    </div>
                  )}

                  {!isGuest && (
                    <Button
                      onClick={logout}
                      variant="outline"
                      size="icon"
                      className="bg-black/5 hover:bg-black/10 border border-slate-200 text-slate-600 rounded-full w-9 h-9 flex-shrink-0 transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="relative">
                    <Button
                      onClick={() => setShowResetConfirm(true)}
                      variant="outline"
                      size="icon"
                      className="bg-red-50 hover:bg-red-100 text-red-500 border border-slate-200 rounded-full w-9 h-9 flex-shrink-0 transition-colors"
                      title={t("Reset All Data")}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>

                    {showResetConfirm && (
                      <div className="absolute top-full right-0 mt-2 bg-white rounded-xl border border-red-100 p-4 w-64 z-50 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-start space-x-3 mb-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {t("Wipe all data?")}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              {t(
                                "This deletes your profile, images, and logs forever.",
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => setShowResetConfirm(false)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-slate-600 h-8 text-xs"
                          >
                            {t("Cancel")}
                          </Button>
                          <Button
                            onClick={handleResetAllData}
                            variant="destructive"
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 h-8 text-xs"
                            disabled={loading}
                          >
                            {loading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              t("Yes, Delete")
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-slate-800"
            >
              Future<span className="font-semibold text-[#3D2B56]">Self</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed"
            >
              {language === "English"
                ? "Discover how your everyday lifestyle choices shape your long-term holistic health."
                : language === "Arabic"
                  ? "اكتشف كيف تشكل خيارات نمط حياتك اليومية صحتك الشاملة على المدى الطويل."
                  : "Discover how your everyday lifestyle choices shape your long-term holistic health."}
            </motion.p>
          </motion.header>

          {simulations.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="max-w-2xl mx-auto"
            >
              <Card className="border border-slate-200 rounded-none md:rounded-xl overflow-hidden">
                <div className="bg-[#3D2B56] text-white p-4 md:p-8">
                  <h2 className="text-2xl font-medium mb-2">
                    {t("Your Baseline Profile") || "Your Baseline Profile"}
                  </h2>
                  <p className="text-white/80">
                    {language === "English"
                      ? "Enter your current lifestyle details to see your future health projection."
                      : language === "Arabic"
                        ? "أدخل تفاصيل نمط حياتك الحالي لرؤية توقعات صحتك المستقبلية."
                        : "Enter your current lifestyle details to see your future health projection."}
                  </p>
                </div>
                <CardContent className="p-4 md:p-8 bg-white">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: { staggerChildren: 0.15 },
                      },
                    }}
                    className="space-y-8"
                  >
                    {/* Stepper Header */}
                    <div className="flex items-center justify-between mb-8 relative">
                      <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-100 -z-10 -translate-y-1/2"></div>
                      <div
                        className="absolute left-0 top-1/2 h-0.5 bg-[#3D2B56] -z-10 -translate-y-1/2 transition-all duration-500"
                        style={{ width: `${(onboardingStep - 1) * 33}%` }}
                      ></div>

                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${onboardingStep >= step ? "bg-[#3D2B56] text-white" : "bg-white border-2 border-slate-200 text-slate-400"}`}
                        >
                          {step}
                        </div>
                      ))}
                    </div>

                    {/* Step 1: Biometrics */}
                    {onboardingStep === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-xl font-semibold text-black flex items-center">
                          <User className="w-5 h-5 mr-2 text-[#3D2B56]" /> Step
                          1: Basic Biometrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-none md:rounded-lg border border-slate-100">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <Label className="text-base font-medium">
                                {t("Age")}
                              </Label>
                              <span className="text-black/60 font-mono">
                                {age} years
                              </span>
                            </div>
                            <Slider
                              value={age}
                              onValueChange={(v) =>
                                setAge(Array.isArray(v) ? v[0] : (v as number))
                              }
                              min={18}
                              max={100}
                              step={1}
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <Label className="text-base font-medium">
                                {t("Gender")}
                              </Label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setGender("Male")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${gender === "Male" ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                <User className="w-6 h-6 mb-2" />
                                <span className="font-medium">{t("Male")}</span>
                              </motion.button>
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setGender("Female")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${gender === "Female" ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                <User className="w-6 h-6 mb-2" />
                                <span className="font-medium">
                                  {t("Female")}
                                </span>
                              </motion.button>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <Label className="text-base font-medium">
                                {t("Height (cm)")}
                              </Label>
                              <span className="text-black/60 font-mono">
                                {height} cm
                              </span>
                            </div>
                            <Slider
                              value={height}
                              onValueChange={(v) =>
                                setHeight(
                                  Array.isArray(v) ? v[0] : (v as number),
                                )
                              }
                              min={100}
                              max={250}
                              step={1}
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="text-base font-medium">
                                {t("Weight (kg)")}
                              </Label>
                              <div className="flex items-center space-x-2">
                                <span className="text-black/60 font-mono">
                                  {weight} kg (BMI: {bmi})
                                </span>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-4 h-4 text-black/40 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>
                                      BMI is a useful baseline screening tool,
                                      but it doesn't differentiate between
                                      muscle and fat. This is why your diet and
                                      activity inputs are crucial for an
                                      accurate simulation.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </div>
                            <Slider
                              value={weight}
                              onValueChange={(v) =>
                                setWeight(
                                  Array.isArray(v) ? v[0] : (v as number),
                                )
                              }
                              min={40}
                              max={200}
                              step={1}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Lifestyle Habits & Sleep */}
                    {onboardingStep === 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold text-black flex items-center">
                            <Activity className="w-5 h-5 mr-2 text-[#3D2B56]" />{" "}
                            Step 2: Lifestyle & Habits
                          </h3>
                          <div className="space-y-6 bg-slate-50/50 p-6 rounded-none md:rounded-lg border border-slate-100">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                  {t("Activity Level")}
                                </Label>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {[
                                  {
                                    value: "Sedentary",
                                    icon: Armchair,
                                    label: t("Sedentary"),
                                  },
                                  {
                                    value: "Light",
                                    icon: Footprints,
                                    label: t("Light"),
                                  },
                                  {
                                    value: "Moderate",
                                    icon: Activity,
                                    label: t("Moderate"),
                                  },
                                  {
                                    value: "Active",
                                    icon: Dumbbell,
                                    label: t("Active"),
                                  },
                                  {
                                    value: "Very Active",
                                    icon: Zap,
                                    label: t("Very Active"),
                                  },
                                ].map((item) => (
                                  <motion.button
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={item.value}
                                    onClick={() => setActivityLevel(item.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${activityLevel === item.value ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                                  >
                                    <item.icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium text-center">
                                      {item.label}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                  {t("Diet Quality")}
                                </Label>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  {
                                    value: "Poor",
                                    icon: Pizza,
                                    label: t("Poor"),
                                  },
                                  {
                                    value: "Average",
                                    icon: Utensils,
                                    label: t("Average"),
                                  },
                                  {
                                    value: "Healthy",
                                    icon: Apple,
                                    label: t("Good"),
                                  },
                                  {
                                    value: "Excellent",
                                    icon: Sparkles,
                                    label: t("Excellent"),
                                  },
                                ].map((item) => (
                                  <motion.button
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={item.value}
                                    onClick={() => setDiet(item.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${diet === item.value ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                                  >
                                    <item.icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium text-center">
                                      {item.label}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                  {t("Smoking Status")}
                                </Label>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                  {
                                    value: "Never",
                                    icon: CigaretteOff,
                                    label: t("Never"),
                                  },
                                  {
                                    value: "Former",
                                    icon: History,
                                    label: t("Former"),
                                  },
                                  {
                                    value: "Current",
                                    icon: Cigarette,
                                    label: t("Current"),
                                  },
                                ].map((item) => (
                                  <motion.button
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={item.value}
                                    onClick={() => setSmokingStatus(item.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${smokingStatus === item.value ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                                  >
                                    <item.icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium text-center">
                                      {item.label}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-black flex items-center">
                            <Brain className="w-5 h-5 mr-2 text-[#3D2B56]" />{" "}
                            Psychology & Sleep
                          </h3>
                          <div className="space-y-6 bg-slate-50/50 p-6 rounded-none md:rounded-lg border border-slate-100">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                  {t("Daily Stress Level")}
                                </Label>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                  {
                                    value: "Low",
                                    icon: Smile,
                                    label: t("Low"),
                                  },
                                  {
                                    value: "Moderate",
                                    icon: Meh,
                                    label: t("Average"),
                                  },
                                  {
                                    value: "High",
                                    icon: Frown,
                                    label: t("High"),
                                  },
                                  {
                                    value: "Severe",
                                    icon: Flame,
                                    label: "Severe",
                                  },
                                ].map((item) => (
                                  <motion.button
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={item.value}
                                    onClick={() => setStressLevel(item.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${stressLevel === item.value ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                                  >
                                    <item.icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium text-center">
                                      {item.label}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                  {t("Sleep Quality")}
                                </Label>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {[
                                  {
                                    value: "Poor",
                                    icon: Coffee,
                                    label: t("Poor"),
                                  },
                                  {
                                    value: "Average",
                                    icon: Bed,
                                    label: t("Average"),
                                  },
                                  {
                                    value: "Excellent",
                                    icon: Moon,
                                    label: t("Excellent"),
                                  },
                                ].map((item) => (
                                  <motion.button
                                    whileHover={{ y: -2, scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    key={item.value}
                                    onClick={() => setSleepQuality(item.value)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${sleepQuality === item.value ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                                  >
                                    <item.icon className="w-6 h-6 mb-2" />
                                    <span className="text-sm font-medium text-center">
                                      {item.label}
                                    </span>
                                  </motion.button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Medical History & Biomarkers */}
                    {onboardingStep === 3 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-4">
                          <h3 className="text-xl font-semibold text-black flex items-center">
                            <Stethoscope className="w-5 h-5 mr-2 text-[#3D2B56]" />{" "}
                            Step 3: Medical Profile
                          </h3>
                          <div className="bg-slate-50/50 p-6 rounded-none md:rounded-lg border border-slate-100">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                  {t("Existing Conditions (Optional)")}
                                </Label>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="w-4 h-4 text-black/40 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>
                                      Select or type any existing conditions.
                                      Leave blank if none.
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-1 pb-2">
                                {[
                                  "Hypertension",
                                  "Type 2 Diabetes",
                                  "High Cholesterol",
                                  "Atrial Fibrillation",
                                  "Coronary Artery Disease",
                                  "Asthma",
                                  "COPD",
                                  "Arthritis",
                                  "Chronic Kidney Disease",
                                ].map((cond) => {
                                  const isSelected =
                                    diseaseConditions &&
                                    diseaseConditions
                                      .split(",")
                                      .map((c) => c.trim().toLowerCase())
                                      .includes(cond.toLowerCase());
                                  return (
                                    <button
                                      key={cond}
                                      type="button"
                                      onClick={() => {
                                        const current = diseaseConditions
                                          ? diseaseConditions
                                              .split(",")
                                              .map((c) => c.trim())
                                              .filter((c) => c)
                                          : [];
                                        if (isSelected) {
                                          setDiseaseConditions(
                                            current
                                              .filter(
                                                (c) =>
                                                  c.toLowerCase() !==
                                                  cond.toLowerCase(),
                                              )
                                              .join(", "),
                                          );
                                        } else {
                                          setDiseaseConditions(
                                            [...current, cond].join(", "),
                                          );
                                        }
                                      }}
                                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all border ${isSelected ? "bg-[#9081B1]/20 border-[#3D2B56]/30 text-[#3D2B56]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}
                                    >
                                      {cond}{" "}
                                      {isSelected && (
                                        <X className="inline-block w-3 h-3 ml-1" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              <Input
                                placeholder="Other conditions (comma separated)..."
                                value={diseaseConditions}
                                onChange={(e) =>
                                  setDiseaseConditions(e.target.value)
                                }
                                className="bg-white h-12"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="text-lg font-semibold text-black flex items-center">
                            <Droplet className="w-5 h-5 mr-2 text-[#3D2B56]" />{" "}
                            Clinical Biomarkers
                          </h4>

                          {/* Dropzone Upload */}
                          <div className="p-4 md:p-6 bg-blue-50/50 rounded-none md:rounded-lg border-2 border-dashed border-blue-200 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 transition-colors hover:bg-blue-50">
                            <div className="bg-white text-blue-600 p-4 rounded-full ring-4 ring-blue-50">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 space-y-1 mt-1">
                              <h4 className="font-semibold text-slate-800 text-lg">
                                Auto-Fill with Lab Results
                              </h4>
                              <p className="text-sm text-slate-600 max-w-lg mb-4">
                                Upload a photo or PDF of your blood work. Our AI
                                will instantly read the document and map your
                                biomarkers.
                              </p>
                              <input
                                type="file"
                                accept="image/*,application/pdf"
                                id="biomarker-upload"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      const base64 = reader.result as string;
                                      setIsExtractingBiomarkers(true);
                                      setExtractionResult(null);
                                      try {
                                        const extracted =
                                          await extractBiomarkers(
                                            base64,
                                            file.type,
                                            language,
                                          );
                                        if (extracted) {
                                          const found: string[] = [];
                                          const missing: string[] = [];
                                          const keys = [
                                            {
                                              key: "totalCholesterol",
                                              label: "Total Cholesterol",
                                            },
                                            { key: "ldl", label: "LDL" },
                                            { key: "hdl", label: "HDL" },
                                            { key: "lpa", label: "Lp(a)" },
                                            {
                                              key: "randomGlucose",
                                              label: "Random Glucose",
                                            },
                                            { key: "hba1c", label: "HbA1c" },
                                            {
                                              key: "bloodPressureSystolic",
                                              label: "Systolic BP",
                                            },
                                            {
                                              key: "bloodPressureDiastolic",
                                              label: "Diastolic BP",
                                            },
                                          ];

                                          keys.forEach((k) => {
                                            if (
                                              extracted[
                                                k.key as keyof typeof extracted
                                              ] !== undefined &&
                                              extracted[
                                                k.key as keyof typeof extracted
                                              ] !== null
                                            ) {
                                              found.push(
                                                `${k.label}: ${extracted[k.key as keyof typeof extracted]}`,
                                              );
                                            } else {
                                              missing.push(k.label);
                                            }
                                          });

                                          setExtractionResult({
                                            extracted,
                                            found,
                                            missing,
                                          });
                                        }
                                      } catch (err) {
                                        console.error(
                                          "Failed to extract biomarkers:",
                                          err,
                                        );
                                      } finally {
                                        setIsExtractingBiomarkers(false);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <Button
                                onClick={() =>
                                  document
                                    .getElementById("biomarker-upload")
                                    ?.click()
                                }
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                disabled={isExtractingBiomarkers}
                              >
                                {isExtractingBiomarkers ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                    {t("Analyzing Document...")}
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 mr-2" />{" "}
                                    {t("Select File")}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          {extractionResult && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white p-5 rounded-none md:rounded-lg border border-green-200"
                            >
                              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                                <CheckCircle2 className="w-5 h-5 mr-2" />{" "}
                                Extraction Complete
                              </h4>
                              <div className="space-y-4 text-sm text-slate-700">
                                <p>
                                  Please review the extracted values. Confirm
                                  below to instantly map them into your profile.
                                </p>

                                {extractionResult.found.length > 0 && (
                                  <div className="bg-green-50/70 p-4 rounded-xl border border-green-100">
                                    <strong className="text-green-900 block mb-2 font-semibold">
                                      Ready to Import:
                                    </strong>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-green-800">
                                      {extractionResult.found.map((f, i) => (
                                        <li
                                          key={f + i}
                                          className="flex items-center"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></div>
                                          {f}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {extractionResult.missing.length > 0 && (
                                  <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-100">
                                    <strong className="text-amber-900 block mb-2 font-semibold">
                                      Missing Variables:
                                    </strong>
                                    <ul className="flex flex-wrap gap-2 text-amber-700">
                                      {extractionResult.missing.map((m, i) => (
                                        <li
                                          key={m + i}
                                          className="bg-amber-100/50 px-2 py-1 rounded text-xs font-medium border border-amber-200/50"
                                        >
                                          {m}
                                        </li>
                                      ))}
                                    </ul>
                                    <p className="mt-3 text-amber-800/80 text-xs font-medium">
                                      These can be entered manually using the
                                      form below.
                                    </p>
                                  </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                  <Button
                                    onClick={() => {
                                      const ex = extractionResult.extracted;
                                      if (
                                        ex.totalCholesterol !== undefined &&
                                        ex.totalCholesterol !== null
                                      )
                                        setTotalCholesterol(
                                          ex.totalCholesterol,
                                        );
                                      if (
                                        ex.ldl !== undefined &&
                                        ex.ldl !== null
                                      )
                                        setLdl(ex.ldl);
                                      if (
                                        ex.hdl !== undefined &&
                                        ex.hdl !== null
                                      )
                                        setHdl(ex.hdl);
                                      if (
                                        ex.lpa !== undefined &&
                                        ex.lpa !== null
                                      )
                                        setLpa(ex.lpa);
                                      if (
                                        ex.randomGlucose !== undefined &&
                                        ex.randomGlucose !== null
                                      )
                                        setRandomGlucose(ex.randomGlucose);
                                      if (
                                        ex.hba1c !== undefined &&
                                        ex.hba1c !== null
                                      )
                                        setHba1c(ex.hba1c);
                                      if (
                                        ex.bloodPressureSystolic !==
                                          undefined &&
                                        ex.bloodPressureSystolic !== null
                                      )
                                        setBloodPressureSystolic(
                                          ex.bloodPressureSystolic,
                                        );
                                      if (
                                        ex.bloodPressureDiastolic !==
                                          undefined &&
                                        ex.bloodPressureDiastolic !== null
                                      )
                                        setBloodPressureDiastolic(
                                          ex.bloodPressureDiastolic,
                                        );
                                      setExtractionResult(null);
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white border border-slate-200 h-10 px-6 rounded-lg font-medium"
                                  >
                                    Confirm & Auto-Fill
                                  </Button>
                                  <Button
                                    onClick={() => setExtractionResult(null)}
                                    variant="outline"
                                    className="border-slate-200 h-10 rounded-lg text-slate-600 hover:bg-slate-50"
                                  >
                                    Discard
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div className="space-y-6">
                            {/* Lipid Profile */}
                            <div className="bg-white p-6 rounded-none md:rounded-lg border border-slate-100">
                              <h4 className="font-semibold text-slate-800 mb-5 flex items-center">
                                <Droplet className="w-5 h-5 mr-2 text-rose-500" />{" "}
                                Lipid Profile (Cholesterol)
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      Total (mg/dL)
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="180"
                                      value={totalCholesterol || ""}
                                      onChange={(e) =>
                                        setTotalCholesterol(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        )
                                      }
                                      className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                    />
                                  </div>
                                  <Slider
                                    min={100}
                                    max={300}
                                    step={1}
                                    value={
                                      typeof totalCholesterol === "number"
                                        ? totalCholesterol
                                        : 180
                                    }
                                    onValueChange={(val) =>
                                      setTotalCholesterol(
                                        Array.isArray(val)
                                          ? val[0]
                                          : (val as number),
                                      )
                                    }
                                    className="py-1"
                                  />
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>100</span>
                                    <span>300</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      LDL (mg/dL)
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="100"
                                      value={ldl || ""}
                                      onChange={(e) =>
                                        setLdl(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        )
                                      }
                                      className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                    />
                                  </div>
                                  <Slider
                                    min={50}
                                    max={250}
                                    step={1}
                                    value={typeof ldl === "number" ? ldl : 100}
                                    onValueChange={(val) =>
                                      setLdl(
                                        Array.isArray(val)
                                          ? val[0]
                                          : (val as number),
                                      )
                                    }
                                    className="py-1"
                                  />
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>50</span>
                                    <span>250</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      HDL (mg/dL)
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="60"
                                      value={hdl || ""}
                                      onChange={(e) =>
                                        setHdl(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        )
                                      }
                                      className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                    />
                                  </div>
                                  <Slider
                                    min={20}
                                    max={100}
                                    step={1}
                                    value={typeof hdl === "number" ? hdl : 60}
                                    onValueChange={(val) =>
                                      setHdl(
                                        Array.isArray(val)
                                          ? val[0]
                                          : (val as number),
                                      )
                                    }
                                    className="py-1"
                                  />
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>20</span>
                                    <span>100</span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                      Lp(a) [mg/dL]
                                    </Label>
                                    <Input
                                      type="number"
                                      placeholder="20"
                                      value={lpa || ""}
                                      onChange={(e) =>
                                        setLpa(
                                          e.target.value
                                            ? Number(e.target.value)
                                            : null,
                                        )
                                      }
                                      className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                    />
                                  </div>
                                  <Slider
                                    min={0}
                                    max={150}
                                    step={1}
                                    value={typeof lpa === "number" ? lpa : 20}
                                    onValueChange={(val) =>
                                      setLpa(
                                        Array.isArray(val)
                                          ? val[0]
                                          : (val as number),
                                      )
                                    }
                                    className="py-1"
                                  />
                                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                    <span>0</span>
                                    <span>150</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Metabolic */}
                              <div className="bg-white p-6 rounded-none md:rounded-lg border border-slate-100">
                                <h4 className="font-semibold text-slate-800 mb-5 flex items-center">
                                  <Zap className="w-5 h-5 mr-2 text-amber-500" />{" "}
                                  Metabolic & Glucose
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Glucose (mg/dL)
                                      </Label>
                                      <Input
                                        type="number"
                                        placeholder="95"
                                        value={randomGlucose || ""}
                                        onChange={(e) =>
                                          setRandomGlucose(
                                            e.target.value
                                              ? Number(e.target.value)
                                              : null,
                                          )
                                        }
                                        className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                      />
                                    </div>
                                    <Slider
                                      min={70}
                                      max={300}
                                      step={1}
                                      value={
                                        typeof randomGlucose === "number"
                                          ? randomGlucose
                                          : 95
                                      }
                                      onValueChange={(val) =>
                                        setRandomGlucose(
                                          Array.isArray(val)
                                            ? val[0]
                                            : (val as number),
                                        )
                                      }
                                      className="py-1"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                      <span>70</span>
                                      <span>300</span>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        HbA1c (%)
                                      </Label>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="5.4"
                                        value={hba1c || ""}
                                        onChange={(e) =>
                                          setHba1c(
                                            e.target.value
                                              ? Number(e.target.value)
                                              : null,
                                          )
                                        }
                                        className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                      />
                                    </div>
                                    <Slider
                                      min={4.0}
                                      max={14.0}
                                      step={0.1}
                                      value={
                                        typeof hba1c === "number" ? hba1c : 5.4
                                      }
                                      onValueChange={(val) =>
                                        setHba1c(
                                          Array.isArray(val)
                                            ? val[0]
                                            : (val as number),
                                        )
                                      }
                                      className="py-1"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                      <span>4.0</span>
                                      <span>14.0</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Vitals */}
                              <div className="bg-white p-6 rounded-none md:rounded-lg border border-slate-100">
                                <h4 className="font-semibold text-slate-800 mb-5 flex items-center">
                                  <Activity className="w-5 h-5 mr-2 text-rose-500" />{" "}
                                  Cardiovascular Vitals
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Systolic (mmHg)
                                      </Label>
                                      <Input
                                        type="number"
                                        placeholder="120"
                                        value={bloodPressureSystolic || ""}
                                        onChange={(e) =>
                                          setBloodPressureSystolic(
                                            e.target.value
                                              ? Number(e.target.value)
                                              : null,
                                          )
                                        }
                                        className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                      />
                                    </div>
                                    <Slider
                                      min={90}
                                      max={200}
                                      step={1}
                                      value={
                                        typeof bloodPressureSystolic ===
                                        "number"
                                          ? bloodPressureSystolic
                                          : 120
                                      }
                                      onValueChange={(val) =>
                                        setBloodPressureSystolic(
                                          Array.isArray(val)
                                            ? val[0]
                                            : (val as number),
                                        )
                                      }
                                      className="py-1"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                      <span>90</span>
                                      <span>200</span>
                                    </div>
                                  </div>
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Diastolic (mmHg)
                                      </Label>
                                      <Input
                                        type="number"
                                        placeholder="80"
                                        value={bloodPressureDiastolic || ""}
                                        onChange={(e) =>
                                          setBloodPressureDiastolic(
                                            e.target.value
                                              ? Number(e.target.value)
                                              : null,
                                          )
                                        }
                                        className="bg-slate-50 border-slate-200 h-9 w-24 px-2 text-right font-medium"
                                      />
                                    </div>
                                    <Slider
                                      min={60}
                                      max={130}
                                      step={1}
                                      value={
                                        typeof bloodPressureDiastolic ===
                                        "number"
                                          ? bloodPressureDiastolic
                                          : 80
                                      }
                                      onValueChange={(val) =>
                                        setBloodPressureDiastolic(
                                          Array.isArray(val)
                                            ? val[0]
                                            : (val as number),
                                        )
                                      }
                                      className="py-1"
                                    />
                                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                      <span>60</span>
                                      <span>130</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Avatar */}
                    {onboardingStep === 4 && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <h3 className="text-xl font-semibold text-black flex items-center">
                          <User className="w-5 h-5 mr-2 text-[#3D2B56]" /> Step
                          4: Avatar (Identity)
                        </h3>
                        <div className="bg-slate-50/50 p-6 rounded-none md:rounded-lg border border-slate-100 space-y-8">
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                Image Style
                              </Label>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setImageStyle("avatar")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${imageStyle === "avatar" ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                <User className="w-6 h-6 mb-2" />
                                <span className="font-medium text-sm">
                                  3D Avatar (Default)
                                </span>
                                <span className="text-xs text-slate-500 mt-1">
                                  Stylized avatar
                                </span>
                              </motion.button>
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setImageStyle("hyperrealistic")}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${imageStyle === "hyperrealistic" ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                <Camera className="w-6 h-6 mb-2" />
                                <span className="font-medium text-sm">
                                  Hyperrealistic
                                </span>
                                <span className="text-xs text-slate-500 mt-1">
                                  Photo-realistic result
                                </span>
                              </motion.button>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                Outfit Selection
                              </Label>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  setOutfit("Standard Medical Uniform (Scrubs)")
                                }
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${outfit === "Standard Medical Uniform (Scrubs)" ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                <ScrubsIcon className="w-8 h-8 mb-2" />
                                <span className="font-medium text-xs text-center leading-tight">
                                  Standard Medical
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1 text-center">
                                  Scrubs
                                </span>
                              </motion.button>
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  setOutfit(
                                    gender === "Female"
                                      ? "Athletic Wear (Tank top and leggings)"
                                      : "Athletic Wear (T-shirt and shorts)",
                                  )
                                }
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${outfit.includes("Athletic") ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                {gender === "Female" ? (
                                  <AthleticFemaleIcon className="w-8 h-8 mb-2" />
                                ) : (
                                  <AthleticMaleIcon className="w-8 h-8 mb-2" />
                                )}
                                <span className="font-medium text-xs text-center leading-tight">
                                  Athletic Wear
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1 text-center leading-tight px-1">
                                  {gender === "Female"
                                    ? "Tank top & leggings"
                                    : "T-shirt & shorts"}
                                </span>
                              </motion.button>
                              <motion.button
                                whileHover={{ y: -2, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() =>
                                  setOutfit(
                                    gender === "Female"
                                      ? "Casual Wear (Blouse and jeans)"
                                      : "Casual Wear (Button-down shirt and chinos)",
                                  )
                                }
                                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${outfit.includes("Casual") ? "border-[#3D2B56] bg-[#9081B1]/10 text-[#3D2B56]" : "border-slate-100 bg-white hover:border-slate-200 text-black"}`}
                              >
                                {gender === "Female" ? (
                                  <CasualFemaleIcon className="w-8 h-8 mb-2" />
                                ) : (
                                  <CasualMaleIcon className="w-8 h-8 mb-2" />
                                )}
                                <span className="font-medium text-xs text-center leading-tight">
                                  Casual Wear
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1 text-center leading-tight px-1">
                                  {gender === "Female"
                                    ? "Blouse & jeans"
                                    : "Shirt & chinos"}
                                </span>
                              </motion.button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Label className="text-sm font-medium text-black/60 uppercase tracking-wider">
                                Face Photo
                              </Label>
                            </div>
                            <CameraCapture
                              onCapture={setFaceImage}
                              initialImage={faceImage}
                              gender={gender}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                      {onboardingStep > 1 ? (
                        <Button
                          variant="outline"
                          onClick={() => setOnboardingStep((prev) => prev - 1)}
                          className="h-12 px-6 rounded-xl border-slate-200"
                        >
                          Back
                        </Button>
                      ) : (
                        <div></div>
                      )}

                      {onboardingStep < 4 ? (
                        <Button
                          onClick={() => setOnboardingStep((prev) => prev + 1)}
                          className="h-12 px-8 rounded-md bg-[#3D2B56] hover:bg-[#3D2B56]/90 text-white"
                        >
                          Next Step <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      ) : (
                        <Button
                          onClick={handleSimulate}
                          className="h-12 px-8 text-base rounded-md bg-[#3D2B56] hover:bg-[#2A1E3C] text-white#3D2B56]/20 transition-all hover:scale-105"
                        >
                          {simulations.length > 0
                            ? t("Update Profile")
                            : t("Generate Journey")}
                          <Sparkles className="ml-2 w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading-overlay"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center justify-center py-32 space-y-8"
              >
                <div className="relative w-32 h-32 flex items-center justify-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full bg-[#9081B1]/30"
                      initial={{ opacity: 0.8, scale: 0.5 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                  <div className="bg-[#3D2B56] p-4 rounded-full relative z-10">
                    <Activity className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>

                <div className="text-center max-w-md mx-auto space-y-4">
                  <LoadingStatusText language={language} />
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2, duration: 1 }}
                    className="bg-slate-50 border border-slate-100 rounded-none md:rounded-lg p-4"
                  >
                    <div className="flex items-center justify-center space-x-2 text-[#9081B1] mb-2">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">
                        While you wait
                      </span>
                    </div>
                    <LoadingTipRotator language={language} />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {simulations.length > 0 && !loading && (
            <div
              className="max-w-7xl mx-auto px-0 lg:px-4 mt-8 space-y-8 relative"
              id="section-top"
            >
              {/* Sticky Profile Header */}
              <div className="relative md:sticky md:top-2 z-40 bg-white/90 backdrop-blur-xl rounded-none md:rounded-xl md:rounded-xl border-y md:border border-slate-200/60 p-3 md:p-5 transition-all hover: flex flex-col gap-3 md:gap-4 overflow-hidden">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 md:gap-5">
                  {/* Top Row (Mobile): Profile Stats & Action Button side-by-side */}
                  <div className="flex flex-row flex-wrap items-center justify-between w-full xl:w-auto shrink-0 gap-2">
                    {/* Left: Profile Information */}
                    <div className="flex items-center space-x-3 shrink-0">
                      <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-[#3D2B56] to-[#5a427d] text-white rounded-full flex items-center justify-center font-bold text-base md:text-xl shrink-0">
                        {age}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-[9px] md:text-[10px] font-bold text-[#9081B1] tracking-wider uppercase mb-0.5 hidden sm:block">
                          Baseline Frame
                        </p>
                        <p className="text-sm text-slate-800 font-bold leading-none mb-1 md:leading-tight md:mb-0">
                          BMI: {bmi}{" "}
                          <span className="text-slate-300 mx-1">•</span>{" "}
                          {gender}
                        </p>
                        <p className="text-[10px] md:text-xs text-slate-500 font-medium capitalize leading-none">
                          {activityLevel.replace("-", " ")}
                        </p>
                      </div>
                    </div>

                    {/* Right on Mobile: Reset & Gamification shortcut */}
                    <div className="flex items-center space-x-2 xl:hidden shrink-0">
                      {gamification && (
                        <div className="flex items-center space-x-2 bg-amber-50/50 px-2.5 py-1 rounded-full border border-amber-100">
                          <div className="flex items-center space-x-1 text-amber-600">
                            <Flame className="w-3 h-3" />
                            <span className="font-bold text-xs">
                              {gamification.vitalityStreak}
                            </span>
                          </div>
                          <div className="w-px h-3 bg-amber-200/50"></div>
                          <div className="flex items-center space-x-1 text-emerald-600 font-semibold text-xs">
                            <Clock className="w-3 h-3" />
                            <span>
                              +
                              {(gamification.timeEarnedMinutes / 60).toFixed(1)}
                              h
                            </span>
                          </div>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSimulations([])}
                        className="border-slate-200 rounded-xl bg-white hover:bg-slate-50 shrink-0 h-8 w-8 p-0"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Center: Nutrition Ribbon (Apple Rings Style) */}
                  <div className="flex flex-wrap flex-1 w-full xl:w-auto items-center justify-center gap-4 sm:gap-6 py-3 px-4 md:px-6 bg-[#261A34] rounded-[2rem] border border-[#3D2B56]/50 shrink-0 shadow-lg relative overflow-hidden">
                    {/* Ring Container lg:scale-110 origin-center transition-transform */}
                    <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Calories Track */}
                        <circle cx="50" cy="50" r="40" stroke="#330011" strokeWidth="8" fill="none" />
                        {/* Calories Progress */}
                        <circle cx="50" cy="50" r="40" stroke="#FA114F" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (Math.min(dailyNutrition.calories / dailyTargets.calories, 1) * 251.2)} strokeLinecap="round" />
                        
                        {/* Protein Track */}
                        <circle cx="50" cy="50" r="28" stroke="#113300" strokeWidth="8" fill="none" />
                        {/* Protein Progress */}
                        <circle cx="50" cy="50" r="28" stroke="#92FF00" strokeWidth="8" fill="none" strokeDasharray="175.9" strokeDashoffset={175.9 - (Math.min(dailyNutrition.protein / dailyTargets.protein, 1) * 175.9)} strokeLinecap="round" />
                        
                        {/* Carbs Track */}
                        <circle cx="50" cy="50" r="16" stroke="#002233" strokeWidth="8" fill="none" />
                        {/* Carbs Progress */}
                        <circle cx="50" cy="50" r="16" stroke="#00E5FF" strokeWidth="8" fill="none" strokeDasharray="100.5" strokeDashoffset={100.5 - (Math.min(dailyNutrition.carbs / dailyTargets.carbs, 1) * 100.5)} strokeLinecap="round" />
                      </svg>
                      {/* Inner Ring Icon - just to make it cooler */}
                      <Flame className="w-3 h-3 text-[#FA114F] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-80" />
                    </div>

                    {/* Stats List */}
                    <div className="flex flex-row flex-wrap items-center justify-center gap-4 sm:gap-6">
                      {/* Calories */}
                      <div className="flex flex-col border-l-2 border-[#FA114F] pl-2">
                        <p className="text-[10px] uppercase font-bold text-[#FA114F] tracking-wider mb-1 leading-none">Calories</p>
                        <p className="text-sm md:text-base font-bold text-white leading-none">
                          {dailyNutrition.calories} <span className="text-[10px] text-white/50 font-normal">/ {dailyTargets.calories} kcal</span>
                        </p>
                      </div>
                      
                      {/* Protein */}
                      <div className="flex flex-col border-l-2 border-[#92FF00] pl-2">
                        <p className="text-[10px] uppercase font-bold text-[#92FF00] tracking-wider mb-1 leading-none">Protein</p>
                        <p className="text-sm md:text-base font-bold text-white leading-none">
                          {dailyNutrition.protein}g <span className="text-[10px] text-white/50 font-normal">/ {dailyTargets.protein}g</span>
                        </p>
                      </div>

                      {/* Carbs */}
                      <div className="flex flex-col border-l-2 border-[#00E5FF] pl-2">
                        <p className="text-[10px] uppercase font-bold text-[#00E5FF] tracking-wider mb-1 leading-none">Carbs</p>
                        <p className="text-sm md:text-base font-bold text-white leading-none">
                          {dailyNutrition.carbs}g <span className="text-[10px] text-white/50 font-normal">/ {dailyTargets.carbs}g</span>
                        </p>
                      </div>

                      {/* Water */}
                      <div 
                        className="flex flex-col border-l-2 border-cyan-500 pl-2 cursor-pointer group hover:bg-white/5 rounded-r pr-3 transition-colors py-1"
                        onClick={() => setWaterIntake((w) => w + 1)}
                        title="Add 1 glass of water"
                      >
                        <p className="text-[10px] uppercase font-bold text-cyan-500 tracking-wider mb-1 flex items-center leading-none">
                          Water <Plus className="w-[10px] h-[10px] ml-1 bg-cyan-500/20 rounded-full inline-block group-hover:scale-110 group-hover:bg-cyan-500/40 opacity-70 transition-all" />
                        </p>
                        <p className="text-sm md:text-base font-bold text-white leading-none">
                          {waterIntake} <span className="text-[10px] text-white/50 font-normal">glasses</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Right: Actions & Gamification Stats (Hidden on mobile) */}
                  <div className="hidden xl:flex items-center justify-end gap-3 shrink-0">
                    {/* GAMIFICATION STATS */}
                    {gamification && (
                      <div className="flex bg-white border border-amber-200/50 rounded-full px-3 py-1.5 items-center relative overflow-hidden group hover:border-amber-400 transition-colors cursor-default shrink-0">
                        {/* Sparkle background element */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-100/30 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] duration-1000 transition-transform"></div>

                        <div
                          className="flex items-center space-x-1.5 relative z-10"
                          title="Vitality Streak: Log food, mood, or complete quests consecutive days to build your streak!"
                        >
                          <Flame
                            className={`w-4 h-4 ${gamification.vitalityStreak > 0 ? "text-orange-500" : "text-slate-400"} ${gamification.vitalityStreak > 2 ? "animate-pulse" : ""}`}
                          />
                          <span className="font-bold text-sm text-slate-700">
                            {gamification.vitalityStreak}
                          </span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 mx-3"></div>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center space-x-1 relative z-10 text-emerald-600 font-semibold text-sm cursor-help bg-transparent border border-slate-200 p-0 outline-none hover:bg-transparent">
                            <Clock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              +
                              {(gamification.timeEarnedMinutes / 60).toFixed(1)}
                              h
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            align="end"
                            className="w-[320px] p-4 font-medium text-slate-700 bg-white border border-slate-200 rounded-xl z-[100]"
                          >
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-bold text-[#3D2B56]">
                                  Biological Time Earned
                                </h4>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  This metric tracks virtual "life extension".
                                  Log healthy meals, positive moods, and
                                  complete quests to earn time. Poor habits
                                  (like junk food) will deduct time, so the
                                  score can increase and decrease.
                                </p>
                              </div>
                              {gamification.timeEarnedHistory &&
                                gamification.timeEarnedHistory.length > 0 && (
                                  <div className="h-[100px] w-full pt-2">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                      Score Trend
                                    </p>
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <LineChart
                                        data={gamification.timeEarnedHistory.map(
                                          (h, i) => ({
                                            index: i,
                                            total: +(
                                              h.totalMinutes / 60
                                            ).toFixed(1),
                                          }),
                                        )}
                                      >
                                        <Line
                                          type="stepAfter"
                                          dataKey="total"
                                          stroke="#10b981"
                                          strokeWidth={2}
                                          dot={false}
                                          isAnimationActive={false}
                                        />
                                        <RechartsTooltip
                                          cursor={{ stroke: "rgba(0,0,0,0.1)" }}
                                          content={({ active, payload }) => {
                                            if (
                                              active &&
                                              payload &&
                                              payload.length
                                            ) {
                                              const item =
                                                gamification.timeEarnedHistory![
                                                  payload[0].payload.index
                                                ];
                                              return (
                                                <div className="bg-slate-900 border border-slate-700 text-white text-[10px] p-2 rounded-lg leading-tight max-w-[150px]">
                                                  <div className="font-semibold">
                                                    {item.reason}
                                                  </div>
                                                  <div
                                                    className={
                                                      item.minutesDelta > 0
                                                        ? "text-emerald-400 mt-0.5 font-bold"
                                                        : "text-rose-400 mt-0.5 font-bold"
                                                    }
                                                  >
                                                    {item.minutesDelta > 0
                                                      ? "+"
                                                      : ""}
                                                    {item.minutesDelta} min
                                                  </div>
                                                </div>
                                              );
                                            }
                                            return null;
                                          }}
                                        />
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}
                            </div>
                          </TooltipContent>
                        </Tooltip>

                        {/* ANIMATION OVERLAY popup logic */}
                        <AnimatePresence>
                          {showTimeEarnedAnim > 0 && (
                            <motion.div
                              key={"time-earn-" + showTimeEarnedAnim}
                              initial={{ opacity: 0, y: 15, scale: 0.5 }}
                              animate={{ opacity: 1, y: -25, scale: 1.2 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute flex items-center justify-center top-0 right-0 font-bold text-emerald-500 z-50 whitespace-nowrap drop-"
                            >
                              +{showTimeEarnedAnim} min!
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSimulations([])}
                      className="border-slate-200 rounded-xl bg-white hover:bg-slate-50 shrink-0 h-9"
                    >
                      <RotateCcw className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Restart</span>
                    </Button>
                  </div>
                </div>

                {/* Bottom Row: Badges - completely hidden on very small mobile, visible on sm and up */}
                <div className="hidden sm:flex pt-3 md:pt-4 border-t border-slate-100/80 items-center overflow-x-auto scrollbar-hide">
                  <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-4 md:mr-6 shrink-0">
                    Evolution Badges
                  </div>
                  <div className="flex items-center space-x-6 md:space-x-8 whitespace-nowrap">
                    {/* Iron Heart */}
                    <div className="flex items-center space-x-2 md:space-x-3 cursor-help group">
                      <div
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 ${healthyFoodLogsCount >= 3 ? "bg-red-50 text-red-500 ring-2 ring-red-100" : "bg-slate-50 text-slate-300"} group-hover:scale-110 transition-transform`}
                      >
                        <HeartPulse
                          className={`w-3.5 h-3.5 md:w-4 md:h-4 ${healthyFoodLogsCount >= 3 && "animate-pulse"}`}
                        />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-slate-800 leading-tight">
                          Lv {Math.floor(healthyFoodLogsCount / 3) + 1}
                        </p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                          Iron Heart
                        </p>
                      </div>
                    </div>

                    {/* Zen Mind */}
                    <div className="flex items-center space-x-2 md:space-x-3 cursor-help group">
                      <div
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 ${lowStressLogsCount >= 3 ? "bg-purple-50 text-purple-500 ring-2 ring-purple-100 group-hover:rotate-12 transition-transform" : "bg-slate-50 text-slate-300"}`}
                      >
                        <Brain className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-slate-800 leading-tight">
                          Lv {Math.floor(lowStressLogsCount / 3) + 1}
                        </p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                          Zen Mind
                        </p>
                      </div>
                    </div>

                    {/* Crystal Lungs */}
                    <div className="flex items-center space-x-2 md:space-x-3 cursor-help group">
                      <div
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 ${vitalityStreakCount >= 2 ? "bg-cyan-50 text-cyan-500 ring-2 ring-cyan-100" : "bg-slate-50 text-slate-300"} group-hover:scale-110 transition-transform`}
                      >
                        <Wind
                          className={`w-3.5 h-3.5 md:w-4 md:h-4 ${vitalityStreakCount >= 2 && "animate-bounce"}`}
                        />
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-bold text-slate-800 leading-tight">
                          Lv {Math.floor(vitalityStreakCount / 2) + 1}
                        </p>
                        <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-slate-500">
                          Crystal Lungs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div
                variants={dashboardContainerVariants}
                initial="hidden"
                animate="show"
                className="flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* LEFT COLUMN: Main Views */}
                  <div className="lg:col-span-8 flex flex-col space-y-12">
                    {/* Tab Content: Timeline & Insights */}
                    <motion.div
                      variants={dashboardItemVariants}
                      id="section-timeline"
                      className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                      {/* Bottom Row: Simulation Comparison */}
                      <div className="space-y-4">
                        {isTimelineImagesReady && (
                        <div className="flex items-center bg-white p-4 rounded-none md:rounded-lg">
                          <h3 className="text-lg font-semibold flex items-center mb-0">
                            <Activity className="w-5 h-5 mr-2 text-black/60" />
                            {t("Compare Timeline")}
                            <ModuleInfoDialog 
                              title="Predictive Anthropomorphic Simulation"
                              info={{
                                purpose: "Synthesizes user's clinical and behavioral inputs to extrapolate physical aging manifestations over a 10 to 20-year horizon.",
                                dataProcessing: "Employs client-side calculations based on inputted risk factors alongside server-side image generation to visualize potential trajectories. Base images are processed securely.",
                                aiTransparency: "Visual age progression uses generative image models controlled by biological age variance factors (e.g., accelerated aging due to stress). Results are illustrative, not exact clinical prognoses.",
                                clinicalBoundaries: "Intended as a behavioral motivator rather than a medical predictive diagnostic tool. Visualizations represent stochastic possibilities, not definitive medical futures."
                              }}
                            />
                          </h3>
                        </div>
                        )}

                        <div className="grid grid-cols-1">
                          {(() => {
                            const nowSim = simulations.find(
                              (s) => s.timeframe === "Now",
                            );
                            const futureSim = simulations.find(
                              (s) => s.timeframe === selectedFuture,
                            );
                            if (!nowSim) return null;

                            const renderOrganComparison = (
                              title: string,
                              organKey: "body" | "heart" | "arteries" | "brain",
                            ) => (
                              <Card className="border border-slate-200 rounded-none md:rounded-xl bg-white overflow-hidden mb-6">
                                <div className="bg-slate-100 p-4 border-b border-slate-200">
                                  <h4 className="font-bold text-lg text-center text-[#3D2B56] uppercase tracking-wider">
                                    {title}
                                  </h4>
                                </div>
                                <CardContent className="p-4 md:p-6">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Now */}
                                    <div className="flex flex-col items-center space-y-4">
                                      <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
                                        {language === "English"
                                          ? "Now"
                                          : language === "Arabic"
                                            ? "الآن"
                                            : "Now"}
                                      </div>
                                      {generatedImages["Now"]?.[organKey] ? (
                                        <img
                                          src={
                                            generatedImages["Now"][organKey] ||
                                            undefined
                                          }
                                          alt={`${title} Now`}
                                          className="w-full aspect-square object-contain bg-white rounded-none md:rounded-lg border-2 border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() =>
                                            setEnlargedImage(
                                              generatedImages["Now"]![
                                                organKey
                                              ]!,
                                            )
                                          }
                                        />
                                      ) : generatingImages["Now"] ? (
                                        <div className="w-full aspect-square relative rounded-none md:rounded-lg overflow-hidden border-2 border-slate-100">
                                          <SmartLoader
                                            message={t("Generating...")}
                                          />
                                        </div>
                                      ) : failedGenerations["Now"] ? (
                                        <div className="w-full aspect-square flex flex-col items-center justify-center bg-red-50 rounded-none md:rounded-lg border-2 border-red-100 text-red-500">
                                          <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                          <span className="text-sm font-semibold mb-3">
                                            {t("Generation Failed")}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRegenerateFailedImages();
                                            }}
                                          >
                                            <RefreshCcw className="w-4 h-4 mr-2" />{" "}
                                            {t("Regenerate")}
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-50/30 rounded-none md:rounded-lg border-2 border-slate-100 border-dashed">
                                          <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-2 opacity-50" />
                                          <span className="text-sm text-black/40">
                                            {t("Waiting in queue...")}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Future */}
                                    <div className="flex flex-col items-center space-y-4">
                                      <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-2">
                                        {language === "English"
                                          ? "Projected"
                                          : language === "Arabic"
                                            ? "متوقع"
                                            : "Projected"}{" "}
                                        {futureSim
                                          ? futureSim.timeframe
                                          : selectedFuture}
                                      </div>
                                      {futureSim &&
                                      generatedImages[futureSim.timeframe]?.[
                                        organKey
                                      ] ? (
                                        <img
                                          src={
                                            generatedImages[
                                              futureSim.timeframe
                                            ][organKey] || undefined
                                          }
                                          alt={`${title} Future`}
                                          className="w-full aspect-square object-contain bg-white rounded-none md:rounded-lg border-2 border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                          onClick={() =>
                                            setEnlargedImage(
                                              generatedImages[
                                                futureSim.timeframe
                                              ]![organKey]!,
                                            )
                                          }
                                        />
                                      ) : futureSim &&
                                        generatingImages[
                                          futureSim.timeframe
                                        ] ? (
                                        <div className="w-full aspect-square relative rounded-none md:rounded-lg overflow-hidden border-2 border-slate-100">
                                          <SmartLoader
                                            message={t("Generating...")}
                                          />
                                        </div>
                                      ) : futureSim &&
                                        failedGenerations[
                                          futureSim.timeframe
                                        ] ? (
                                        <div className="w-full aspect-square flex flex-col items-center justify-center bg-red-50 rounded-none md:rounded-lg border-2 border-red-100 text-red-500">
                                          <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                          <span className="text-sm font-semibold mb-3">
                                            {t("Generation Failed")}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-100"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRegenerateFailedImages();
                                            }}
                                          >
                                            <RefreshCcw className="w-4 h-4 mr-2" />{" "}
                                            {t("Regenerate")}
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="w-full aspect-square flex flex-col items-center justify-center bg-slate-50/30 rounded-none md:rounded-lg border-2 border-slate-100 border-dashed">
                                          <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-2 opacity-50" />
                                          <span className="text-sm text-black/40">
                                            {t("Waiting in queue...")}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );

                            return (
                              <div className="space-y-8">
                                {isTimelineImagesReady && (
                                  <>
                                    {renderOrganComparison("External Body", "body")}
                                    {renderOrganComparison("Arteries", "arteries")}
                                  </>
                                )}

                                {/* Metrics Comparison */}
                                <Card
                                  id="section-metrics-insights"
                                  className="border border-slate-200 rounded-none md:rounded-xl bg-white overflow-hidden mt-8"
                                >
                                  <div className="bg-[#3D2B56] text-white p-6 border-b text-center">
                                    <h3 className="text-xl font-semibold">
                                      Metrics & Insights
                                    </h3>
                                  </div>
                                  <CardContent className="p-4 md:p-8">
                                    <div className="flex flex-col space-y-8 max-w-5xl mx-auto w-full">
                                      {!futureSim ? (
                                        <div className="h-40 flex flex-col items-center justify-center space-y-4 pt-4 text-center">
                                          <Loader2 className="w-8 h-8 text-[#9081B1] animate-spin" />
                                          <span className="text-[#3D2B56] text-sm font-medium">
                                            Computing Future Metrics...
                                          </span>
                                        </div>
                                      ) : (
                                        <>
                                          <ToggleableSummary
                                            nowSim={nowSim}
                                            futureSim={futureSim}
                                            futureLabel={selectedFuture}
                                          />

                                          <MobileCarousel className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 pb-6 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-8 md:pt-4 md:mx-0 md:px-0 md:pb-0 space-x-6 md:space-x-0">
                                            <ToggleableMetricGauge
                                              label="Overall Risk"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={nowSim.overallRisk}
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.overallRisk
                                              }
                                              futureValue={
                                                futureSim.overallRisk
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.overallRisk
                                              }
                                              type="low-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Aggregated cardiovascular disease risk based on your lifestyle profile."
                                            />
                                            <ToggleableMetricGauge
                                              label="Heart Stress"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={nowSim.heartStress}
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.heartStress
                                              }
                                              futureValue={
                                                futureSim.heartStress
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.heartStress
                                              }
                                              type="low-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Measures how hard your heart is working. High values indicate strain and potential for thickening."
                                            />
                                            <ToggleableMetricGauge
                                              label="Artery Health"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={nowSim.arteryHealth}
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.arteryHealth
                                              }
                                              futureValue={
                                                futureSim.arteryHealth
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.arteryHealth
                                              }
                                              type="high-good"
                                              futureLabel={selectedFuture}
                                              tooltip="100 is perfectly clear. Lower values indicate stiffness and atherosclerosis (plaque)."
                                            />
                                            <ToggleableMetricGauge
                                              label="Cognitive Function"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={
                                                nowSim.cognitiveFunction ?? 100
                                              }
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.cognitiveFunction
                                              }
                                              futureValue={
                                                futureSim.cognitiveFunction ??
                                                100
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.cognitiveFunction
                                              }
                                              type="high-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Measures memory, focus, and neurological health."
                                            />
                                            <ToggleableMetricGauge
                                              label="Mental Wellbeing"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={
                                                nowSim.mentalWellbeing ?? 100
                                              }
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.mentalWellbeing
                                              }
                                              futureValue={
                                                futureSim.mentalWellbeing ?? 100
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.mentalWellbeing
                                              }
                                              type="high-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Emotional stability, resilience, and happiness levels."
                                            />
                                            <ToggleableMetricGauge
                                              label="Inflammation Level"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={
                                                nowSim.inflammationLevel ?? 0
                                              }
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.inflammationLevel
                                              }
                                              futureValue={
                                                futureSim.inflammationLevel ?? 0
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.inflammationLevel
                                              }
                                              type="low-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Systemic inflammation (hs-CRP proxy). High levels aggressively damage arteries."
                                            />
                                            <ToggleableMetricGauge
                                              label="Insulin Resistance"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={
                                                nowSim.insulinResistance ?? 0
                                              }
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.insulinResistance
                                              }
                                              futureValue={
                                                futureSim.insulinResistance ?? 0
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.insulinResistance
                                              }
                                              type="low-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Proxy for metabolic syndrome. High levels lead to type-2 diabetes and vascular damage."
                                            />
                                            <ToggleableMetricGauge
                                              label="Cellular Aging"
                                              className="snap-center shrink-0 w-[85vw] md:w-auto"
                                              nowValue={
                                                nowSim.cellularAging ?? 0
                                              }
                                              nowComment={
                                                nowSim.metricComments
                                                  ?.cellularAging
                                              }
                                              futureValue={
                                                futureSim.cellularAging ?? 0
                                              }
                                              futureComment={
                                                futureSim.metricComments
                                                  ?.cellularAging
                                              }
                                              type="low-good"
                                              futureLabel={selectedFuture}
                                              tooltip="Measures how fast your biological clock is ticking relative to your chronologic age."
                                            />
                                          </MobileCarousel>

                                          <ToggleableInsights
                                            nowSim={nowSim}
                                            futureSim={futureSim}
                                            futureLabel={selectedFuture}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Educational Context Section */}
                        <MobileCarousel className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-4 md:grid md:grid-cols-2 md:gap-6 mt-8 md:mx-0 md:px-0 md:pb-0 space-x-4 md:space-x-0">
                          <Card className="snap-center shrink-0 w-[85vw] md:w-auto border border-slate-200 rounded-none md:rounded-lg bg-slate-50">
                            <CardContent className="p-4 md:p-6 space-y-4">
                              <div className="flex items-center space-x-2 text-[#3D2B56]">
                                <Stethoscope className="w-6 h-6" />
                                <h4 className="font-bold text-xl">
                                  The Science Behind Your Result
                                </h4>
                              </div>
                              <div className="text-black/80 leading-relaxed text-sm">
                                {getScienceContext()}
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="snap-center shrink-0 w-[85vw] md:w-auto border border-slate-200 rounded-none md:rounded-lg bg-slate-50">
                            <CardContent className="p-4 md:p-6 space-y-4">
                              <div className="flex items-center space-x-2 text-[#3D2B56]">
                                <Lightbulb className="w-6 h-6" />
                                <h4 className="font-bold text-xl">
                                  Actionable Next Best Step
                                </h4>
                              </div>
                              <div className="text-black/80 leading-relaxed">
                                {getImpactSuggestion()}
                              </div>
                            </CardContent>
                          </Card>
                        </MobileCarousel>
                      </div>
                    </motion.div>

                    {/* Tab Content: Optimized Future */}
                    {isTakeControlReady && (
                    <motion.div
                      variants={dashboardItemVariants}
                      id="section-take-control"
                      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                      {/* Take Control Section */}
                      <div className="mt-4 space-y-8 no-print">
                        <div className="text-center space-y-2">
                          <h3 className="text-2xl font-bold text-black">
                            {t("Take Control of Your Future")}
                          </h3>
                          <p className="text-black/60">
                            {t(
                              "See how optimizing your lifestyle changes your trajectory.",
                            )}
                          </p>
                        </div>

                        <MobileCarousel className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-4 md:grid md:grid-cols-1 lg:grid-cols-3 md:gap-6 md:mx-0 md:px-0 md:pb-0 space-x-4 md:space-x-0">
                          {/* Side-by-Side Image Comparison - Arteries */}
                          <Card className="snap-center shrink-0 w-[85vw] md:w-auto lg:col-span-3 border border-slate-200 rounded-none md:rounded-lg overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                              <CardTitle className="flex items-center space-x-2">
                                <Camera className="w-5 h-5 text-[#9081B1]" />
                                <span>
                                  {t("10-Year Visual Impact: Arteries")}
                                </span>
                              </CardTitle>
                              <CardDescription>
                                {t(
                                  "Compare your current trajectory vs. an optimized lifestyle in 10 years.",
                                )}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="relative w-full aspect-video md:aspect-[21/9] bg-slate-100 overflow-hidden group">
                                <ImageComparisonSlider
                                  baseImage={
                                    generatedImages["10 Years"]?.arteries
                                  }
                                  overlayImage={optimizedImages?.arteries}
                                  baseLabel={t("Current Path")}
                                  overlayLabel={t("Optimized Path")}
                                  isLoading={
                                    generatingOptimizedImage ||
                                    generatingImages["10 Years"]
                                  }
                                  hasFailed={
                                    failedOptimized ||
                                    failedGenerations["10 Years"]
                                  }
                                  onRegenerate={handleRegenerateFailedImages}
                                />
                              </div>
                            </CardContent>
                          </Card>

                          {/* Side-by-Side Image Comparison - Body */}
                          <Card className="snap-center shrink-0 w-[85vw] md:w-auto lg:col-span-3 border border-slate-200 rounded-none md:rounded-lg overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                              <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5 text-[#9081B1]" />
                                <span>
                                  {t("10-Year Visual Impact: External Body")}
                                </span>
                              </CardTitle>
                              <CardDescription>
                                {t(
                                  "Compare your current trajectory vs. an optimized lifestyle in 10 years.",
                                )}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="relative w-full aspect-square md:aspect-video bg-white overflow-hidden group">
                                <ImageComparisonSlider
                                  baseImage={generatedImages["10 Years"]?.body}
                                  overlayImage={optimizedImages?.body}
                                  baseLabel={t("Current Path")}
                                  overlayLabel={t("Optimized Path")}
                                  isLoading={
                                    generatingOptimizedImage ||
                                    generatingImages["10 Years"]
                                  }
                                  imageClassName="object-contain"
                                  hasFailed={
                                    failedOptimized ||
                                    failedGenerations["10 Years"]
                                  }
                                  onRegenerate={handleRegenerateFailedImages}
                                />
                              </div>
                            </CardContent>
                          </Card>

                          {/* Chart */}
                          <Card className="snap-center shrink-0 w-[85vw] md:w-auto lg:col-span-3 xl:col-span-2 border border-slate-200 rounded-none md:rounded-lg">
                            <CardHeader>
                              <CardTitle className="flex items-center space-x-2">
                                <TrendingDown className="w-5 h-5 text-[#9081B1]" />
                                <span>Risk Trajectory Comparison</span>
                              </CardTitle>
                              <CardDescription>
                                Your current overall risk vs. an optimized
                                lifestyle (no smoking, excellent diet, active).
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="pb-4">
                                <div className="h-[400px] w-full shrink-0">
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <LineChart
                                      data={chartData}
                                      margin={{
                                        top: 5,
                                        right: 20,
                                        bottom: 5,
                                        left: 0,
                                      }}
                                    >
                                      <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#f1f5f9"
                                      />
                                      <XAxis
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        fontSize={12}
                                      />
                                      <YAxis
                                        stroke="#94a3b8"
                                        fontSize={12}
                                        unit="%"
                                      />
                                      <RechartsTooltip
                                        contentStyle={{
                                          borderRadius: "12px",
                                          border: "none",
                                          boxShadow:
                                            "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                        }}
                                      />
                                      <Legend
                                        wrapperStyle={{ paddingTop: "20px" }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="Current Trajectory"
                                        stroke="#ef4444"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                      />
                                      <Line
                                        type="monotone"
                                        dataKey="Optimized Trajectory"
                                        stroke="#22c55e"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                      />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </MobileCarousel>
                      </div>
                    </motion.div>
                    )}

                    {/* Tab Content: Action Plan */}
                    <motion.div
                      variants={dashboardItemVariants}
                      id="section-action-plan"
                      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                      {/* Action Plan & Export */}
                      <div className="space-y-6 mt-4">
                        {!parsedActionPlan ? (
                          <Card className="border border-slate-200 rounded-none md:rounded-lg bg-white overflow-hidden relative border-dashed border-2 border-slate-200">
                            <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-6">
                              {loadingActionPlan ? (
                                <div className="flex flex-col items-center space-y-6 w-full py-8">
                                  <div className="relative w-24 h-24">
                                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                                    <div className="absolute inset-0 border-4 border-[#3D2B56] border-t-transparent rounded-full animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Sparkles className="w-8 h-8 text-[#3D2B56] animate-pulse" />
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <p className="font-bold text-lg text-[#3D2B56] animate-pulse">
                                      Designing your 30-day regimen...
                                    </p>
                                    <LoadingTipRotator language={language} />
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                                    <CalendarDays className="w-12 h-12 text-[#9081B1]" />
                                  </div>
                                  <div className="space-y-2">
                                    <h4 className="text-xl font-bold text-slate-800">
                                      Your Action Plan is Empty
                                    </h4>
                                    <p className="text-slate-500 max-w-md mx-auto">
                                      Get a personalized, 30-day step-by-step
                                      regimen generated by AI to start improving
                                      your cardiovascular health and overall
                                      trajectory today.
                                    </p>
                                  </div>
                                  <Button
                                    onClick={handleGenerateActionPlan}
                                    disabled={loadingActionPlan}
                                    className="bg-[#3D2B56] hover:bg-[#2A1E3C] text-white w-full max-w-sm h-12 rounded-xl"
                                  >
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Generate 30-Day Algorithm
                                  </Button>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        ) : (
                          <Card className="border border-slate-200 rounded-none md:rounded-lg bg-slate-900 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                              <CalendarDays className="w-24 h-24" />
                            </div>
                            <CardContent className="p-4 md:p-6 relative z-10 flex flex-col space-y-4">
                              <h4 className="text-xl font-bold">
                                30-Day Action Plan Generated!
                              </h4>
                              <Button
                                onClick={handleGenerateActionPlan}
                                disabled={loadingActionPlan}
                                className="w-full bg-white text-black hover:bg-slate-100 transition-colors"
                              >
                                {loadingActionPlan ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                )}
                                {loadingActionPlan
                                  ? "Regenerating..."
                                  : "Regenerate Plan"}
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            onClick={() => {
                              if (hcpReport) setShowHcpModal(true);
                              else handleGenerateHcpReport();
                            }}
                            disabled={generatingHcp}
                            variant="outline"
                            className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl h-12"
                          >
                            {generatingHcp ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <FileText className="w-4 h-4 mr-2" />
                            )}
                            {generatingHcp
                              ? "Generating HCP Report..."
                              : "Clinical HCP Summary"}
                          </Button>

                          <Button
                            onClick={() => window.print()}
                            variant="outline"
                            className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50 rounded-xl h-12"
                          >
                            <Printer className="w-4 h-4 mr-2" /> PDF / Print
                            Record
                          </Button>
                        </div>
                      </div>

                      {/* Action Plan Interactive View */}
                      <AnimatePresence>
                        {parsedActionPlan && (
                          <motion.div
                            key="action-plan"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6 pt-4"
                          >
                            <Card className="border border-slate-200#3D2B56]/10 rounded-none md:rounded-xl bg-white print-hide">
                              <CardHeader className="bg-[#3D2B56] text-white p-4 md:p-8 rounded-t-3xl sticky top-0 z-20">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div>
                                    <CardTitle className="text-2xl font-bold flex items-center">
                                      Your Prescribed Regimen
                                      <ModuleInfoDialog 
                                        title="Algorithmic Health Trajectory & Interventions"
                                        info={{
                                          purpose: "Aggregates longitudinal data streams to synthesize a multi-week behavioral protocol targeting acute decay metrics via micro-habits.",
                                          dataProcessing: "The user's summarized health profile is sent to the LLM to generate a structured JSON adherence plan. Metrics are stored locally.",
                                          aiTransparency: "AI reasoning synthesizes generalized medical knowledge (e.g., CDC guidelines, behavioral psychology literature) to formulate actionable lifestyle routines.",
                                          clinicalBoundaries: "The generated plan is a wellness protocol (diet, sleep, movement nudges), strictly classified as general wellness software. It explicitly does not intend to treat, cure, or mitigate any disease."
                                        }}
                                      />
                                    </CardTitle>
                                    <CardDescription className="text-white/80">
                                      Follow this algorithm to reach your
                                      optimized future.
                                    </CardDescription>
                                  </div>

                                  {/* Week Selector */}
                                  <div className="flex w-full md:w-auto bg-white/10 p-1.5 rounded-xl backdrop-blur-sm">
                                    {parsedActionPlan.weeks.map((week, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => setActiveWeek(idx)}
                                        className={`flex-1 px-2 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${activeWeek === idx ? "bg-white text-[#3D2B56]" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                                      >
                                        Week {idx + 1}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-0 overflow-hidden rounded-b-3xl">
                                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
                                  {/* Left Sidebar - Theme */}
                                  <div className="md:col-span-4 bg-slate-50 p-4 md:p-8 flex flex-col justify-center">
                                    <h3 className="text-[#3D2B56] font-bold text-lg mb-2 uppercase tracking-widest text-sm">
                                      Week {activeWeek + 1} Focus
                                    </h3>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-tight mb-4">
                                      {parsedActionPlan.weeks[activeWeek]
                                        ?.title || "General Focus"}
                                    </h2>
                                    <div className="w-12 h-1 bg-[#9081B1] rounded-full"></div>
                                  </div>

                                  {/* Right Content - Tasks */}
                                  <div className="md:col-span-8 p-4 md:p-8 bg-white overflow-y-auto article-prose">
                                    <AnimatePresence mode="wait">
                                      <motion.div
                                        key={activeWeek}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="prose prose-slate max-w-none prose-headings:text-[#3D2B56] prose-li:marker:text-[#9081B1] prose-h3:text-xl prose-h3:font-bold prose-strong:text-[#4a3666]"
                                      >
                                        <Markdown
                                          components={{
                                            ul: ({ node, ...props }) => (
                                              <ul
                                                className="pl-6 space-y-3 my-6"
                                                {...props}
                                              />
                                            ),
                                            li: ({ node, ...props }) => (
                                              <li className="pl-2" {...props}>
                                                <div className="flex items-start">
                                                  <span className="flex-1">
                                                    {props.children}
                                                  </span>
                                                </div>
                                              </li>
                                            ),
                                          }}
                                        >
                                          {parsedActionPlan.weeks[activeWeek]
                                            ?.content ||
                                            "*No content for this week.*"}
                                        </Markdown>
                                      </motion.div>
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                  {/* RIGHT COLUMN: Sidebar Widgets */}
                  <motion.div
                    id="section-trackers"
                    variants={dashboardItemVariants}
                    className="lg:col-span-4 flex flex-col space-y-6"
                  >
                    <NotificationManager />

                    {/* Tab Content: Food Tracker */}
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <Drawer.Root
                        open={showFoodLogDrawer}
                        onOpenChange={setShowFoodLogDrawer}
                        direction="right"
                      >
                        <Drawer.Portal>
                          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
                          <Drawer.Content className="right-0 top-0 bottom-0 fixed z-[100] w-full md:w-[900px] flex outline-none bg-slate-50 border-l border-slate-200">
                            <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-8">
                              <div className="flex justify-between items-center mb-6">
                                <Drawer.Title className="text-2xl font-bold text-slate-800">
                                  Food Logging
                                </Drawer.Title>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowFoodLogDrawer(false)}
                                  className="rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                                >
                                  <X className="w-5 h-5" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Col: Logging & History */}
                                <div className="lg:col-span-1 space-y-6">
                                  <Card className="border border-slate-200 rounded-none md:rounded-lg bg-white">
                                    <CardHeader>
                                      <CardTitle className="text-xl text-black flex items-center">
                                        Log a Meal
                                        <ModuleInfoDialog 
                                          title="Dietary Analysis & Logging"
                                          info={{
                                            purpose: "Converts natural language or images into structured macronutrient and caloric profiles to log dietary intake.",
                                            dataProcessing: "Images/Text are processed by an LLM to estimate food metrics. The data is saved locally on the device.",
                                            aiTransparency: "Nutritional outputs are estimated by Gemini based on typical recipes and serving sizes. They are illustrative and not a substitute for clinical exactness.",
                                            clinicalBoundaries: "Not intended to diagnose or treat metabolic conditions. General wellness feature."
                                          }}
                                        />
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {/* Media Upload */}
                                      <div className="space-y-2">
                                        <Label className="text-sm font-bold text-black/40 uppercase tracking-wider">
                                          Visual Scan
                                        </Label>
                                        {mealImage ? (
                                          <div className="relative rounded-xl overflow-hidden mb-2 border border-slate-100 bg-black flex items-center justify-center">
                                            {mealImage.startsWith(
                                              "data:video",
                                            ) ? (
                                              <video
                                                src={mealImage}
                                                className="w-full h-48 object-cover"
                                                controls
                                                autoPlay
                                                muted
                                                playsInline
                                              />
                                            ) : (
                                              <img
                                                src={mealImage || undefined}
                                                className="w-full h-48 object-cover"
                                              />
                                            )}
                                            <button
                                              onClick={() => setMealImage(null)}
                                              className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-md text-white hover:bg-black/70 transition-colors z-10"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="border-2 border-dashed border-[#9081B1]/40 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50/50 transition-colors relative h-40">
                                            <Camera className="w-8 h-8 text-[#9081B1] mb-2" />
                                            <span className="text-sm font-medium text-[#3D2B56]">
                                              Tap to capture photo/video
                                            </span>
                                            <input
                                              type="file"
                                              accept="image/*,video/*"
                                              onChange={handleMealImageUpload}
                                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                          </div>
                                        )}
                                        <Button
                                          onClick={handleAnalyzeMeal}
                                          disabled={!mealImage || analyzingMeal}
                                          className="w-full bg-[#3D2B56] hover:bg-[#3D2B56]/90 text-white rounded-xl"
                                        >
                                          {analyzingMeal ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                              Analyzing Vision...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-4 h-4 mr-2" />{" "}
                                              Analyze Image
                                            </>
                                          )}
                                        </Button>
                                      </div>

                                      <div className="relative flex items-center py-2">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-semibold uppercase">
                                          Or describe it
                                        </span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                      </div>

                                      {/* Voice / Text Upload */}
                                      <div className="space-y-2">
                                        <Label className="text-sm font-bold text-black/40 uppercase tracking-wider">
                                          Voice Journal
                                        </Label>
                                        <div className="relative">
                                          <Input
                                            value={mealTranscript}
                                            onChange={(e) =>
                                              setMealTranscript(e.target.value)
                                            }
                                            placeholder="I just ate..."
                                            className="pr-12 rounded-xl bg-slate-50 border-slate-200"
                                          />
                                          <button
                                            onClick={toggleMealRecording}
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isRecordingMeal ? "bg-red-100 text-red-500 animate-pulse" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
                                          >
                                            <Mic className="w-4 h-4" />
                                          </button>
                                        </div>
                                        <Button
                                          onClick={handleAnalyzeMealText}
                                          disabled={
                                            !mealTranscript || analyzingMeal
                                          }
                                          className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl"
                                        >
                                          {analyzingMeal ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                                              Processing...
                                            </>
                                          ) : (
                                            <>
                                              <Type className="w-4 h-4 mr-2" />{" "}
                                              Log from Voice
                                            </>
                                          )}
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>

                                  {/* History */}
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-black flex items-center">
                                      <History className="w-4 h-4 mr-2 text-[#9081B1]" />{" "}
                                      Recent Logs
                                    </h4>
                                    {foodLogs.length === 0 && (
                                      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-200 rounded-none md:rounded-lg text-center space-y-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                          <Utensils className="w-8 h-8 text-[#9081B1]" />
                                        </div>
                                        <div>
                                          <p className="font-semibold text-slate-700">
                                            No Meals Logged Yet
                                          </p>
                                          <p className="text-sm text-slate-500 max-w-[200px] mx-auto mt-1">
                                            Upload a photo of your food to let
                                            AI instantly analyze the nutrients
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                                      {foodLogs.map((log) => (
                                        <div
                                          key={log.id}
                                          className="bg-white p-3 rounded-xl border border-slate-100 flex items-start space-x-3 transition-all hover:"
                                        >
                                          {log.imageUrl ? (
                                            log.imageUrl.startsWith(
                                              "data:video",
                                            ) ? (
                                              <video
                                                src={log.imageUrl}
                                                className="w-16 h-16 rounded-lg object-cover border border-slate-100 bg-black"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                              />
                                            ) : (
                                              <img
                                                src={log.imageUrl}
                                                className="w-16 h-16 rounded-lg object-cover border border-slate-100"
                                              />
                                            )
                                          ) : (
                                            <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                                              <Utensils className="w-6 h-6" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                              <p className="font-bold text-sm text-slate-800 tracking-tight">
                                                {log.foodName || "Scanned Meal"}
                                              </p>
                                              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider ml-2 shrink-0">
                                                {new Date(
                                                  log.date,
                                                ).toLocaleString([], {
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </p>
                                            </div>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                              {log.analysis.details}
                                            </p>

                                            {log.analysis
                                              .healthScoreExplanation && (
                                              <div className="mt-2 text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">
                                                {
                                                  log.analysis
                                                    .healthScoreExplanation
                                                }
                                              </div>
                                            )}

                                            {log.analysis
                                              .improvementSuggestion && (
                                              <div className="mt-2 text-[11px] text-emerald-700 bg-emerald-50/80 p-2 rounded-lg border border-emerald-100 flex items-start space-x-1.5">
                                                <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <span>
                                                  <span className="font-semibold">
                                                    Tip:{" "}
                                                  </span>
                                                  {
                                                    log.analysis
                                                      .improvementSuggestion
                                                  }
                                                </span>
                                              </div>
                                            )}

                                            {log.analysis.macros && (
                                              <div className="flex items-center space-x-2 mt-2">
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                                                  Protein:{" "}
                                                  {log.analysis.macros.protein}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600 border border-orange-100">
                                                  Carbs:{" "}
                                                  {log.analysis.macros.carbs}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                  Fats:{" "}
                                                  {log.analysis.macros.fats}
                                                </span>
                                              </div>
                                            )}

                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                                              <div className="text-xs text-[#9081B1] font-semibold bg-[#9081B1]/10 px-2.5 py-1 rounded-md">
                                                {log.analysis.calories} kcal
                                              </div>
                                              <div
                                                className="text-xs font-bold px-2.5 py-1 rounded-md flex items-center"
                                                style={{
                                                  color:
                                                    log.analysis.healthScore >
                                                    70
                                                      ? "#22c55e"
                                                      : log.analysis
                                                            .healthScore > 40
                                                        ? "#f59e0b"
                                                        : "#ef4444",
                                                  backgroundColor:
                                                    log.analysis.healthScore >
                                                    70
                                                      ? "rgba(34,197,94,0.1)"
                                                      : log.analysis
                                                            .healthScore > 40
                                                        ? "rgba(245,158,11,0.1)"
                                                        : "rgba(239,68,68,0.1)",
                                                }}
                                              >
                                                Score:{" "}
                                                {log.analysis.healthScore}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Col: Trends & Impact */}
                                <div className="lg:col-span-2 space-y-6">
                                  <Card className="border border-slate-200 rounded-none md:rounded-lg bg-white h-full">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                      <CardTitle className="text-xl text-black">
                                        Dietary Trend & Impact Analysis
                                      </CardTitle>
                                      {foodLogs.length > 0 && (
                                        <Button
                                          onClick={() => {
                                            handleSimulate();
                                            setActiveTab("timeline");
                                          }}
                                          disabled={!hasNewFoodLog || loading}
                                          className={`rounded-xl transition-all duration-500 scale-100 ${
                                            hasNewFoodLog
                                              ? "bg-emerald-600 hover:bg-emerald-700 text-white/30 ring-2 ring-emerald-500 ring-offset-2"
                                              : "bg-slate-100/50 text-slate-400 cursor-not-allowed border border-slate-200 hover:bg-slate-100/50"
                                          }`}
                                        >
                                          {loading ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          ) : (
                                            <Sparkles className="w-4 h-4 mr-2" />
                                          )}
                                          Update Projection
                                        </Button>
                                      )}
                                    </CardHeader>
                                    <CardContent>
                                      {foodLogs.length > 0 ? (
                                        <div className="space-y-8 animate-in fade-in">
                                          <div>
                                            <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-4 block">
                                              Health Score Trend
                                            </Label>
                                            <div className="h-72 w-full mb-6 bg-slate-50/30 rounded-xl p-4 border border-slate-100 shrink-0">
                                                <ResponsiveContainer
                                                  width="100%"
                                                  height="100%"
                                                >
                                                  <LineChart
                                                    data={[...foodLogs]
                                                      .reverse()
                                                      .map((l) => ({
                                                        ...l,
                                                        dateStr: new Date(
                                                          l.date,
                                                        ).toLocaleString([], {
                                                          month: "short",
                                                          day: "numeric",
                                                        }),
                                                      }))}
                                                  >
                                                    <CartesianGrid
                                                      strokeDasharray="3 3"
                                                      vertical={false}
                                                      stroke="#E9E9F3"
                                                    />
                                                    <XAxis
                                                      dataKey="dateStr"
                                                      stroke="#94a3b8"
                                                      fontSize={12}
                                                      tickLine={false}
                                                      axisLine={false}
                                                    />
                                                    <YAxis
                                                      stroke="#94a3b8"
                                                      fontSize={12}
                                                      domain={[0, 100]}
                                                      tickLine={false}
                                                      axisLine={false}
                                                    />
                                                    <RechartsTooltip
                                                      contentStyle={{
                                                        borderRadius: "12px",
                                                        border: "none",
                                                        boxShadow:
                                                          "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                                      }}
                                                    />
                                                    <Line
                                                      type="monotone"
                                                      dataKey="analysis.healthScore"
                                                      name="Health Score"
                                                      stroke="#9081B1"
                                                      strokeWidth={3}
                                                      dot={{
                                                        r: 5,
                                                        fill: "#3D2B56",
                                                        strokeWidth: 2,
                                                        stroke: "#fff",
                                                      }}
                                                      activeDot={{ r: 7 }}
                                                    />
                                                  </LineChart>
                                                </ResponsiveContainer>
                                              </div>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-4 block">
                                              Latest Impact on Baseline
                                            </Label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                              <div className="bg-slate-50/50 p-5 rounded-none md:rounded-lg border border-[#9081B1]/20">
                                                <h5 className="font-semibold text-[#3D2B56] flex items-center mb-3">
                                                  <Activity className="w-5 h-5 mr-2" />{" "}
                                                  Heart
                                                </h5>
                                                <p className="text-sm text-black/80 font-medium leading-relaxed">
                                                  {
                                                    foodLogs[0].analysis
                                                      .impactOnHeart
                                                  }
                                                </p>
                                              </div>
                                              <div className="bg-slate-50/50 p-5 rounded-none md:rounded-lg border border-[#9081B1]/20">
                                                <h5 className="font-semibold text-[#3D2B56] flex items-center mb-3">
                                                  <TrendingDown className="w-5 h-5 mr-2" />{" "}
                                                  Arteries
                                                </h5>
                                                <p className="text-sm text-black/80 font-medium leading-relaxed">
                                                  {
                                                    foodLogs[0].analysis
                                                      .impactOnArteries
                                                  }
                                                </p>
                                              </div>
                                              <div className="bg-slate-50/50 p-5 rounded-none md:rounded-lg border border-[#9081B1]/20">
                                                <h5 className="font-semibold text-[#3D2B56] flex items-center mb-3">
                                                  <User className="w-5 h-5 mr-2" />{" "}
                                                  Body
                                                </h5>
                                                <p className="text-sm text-black/80 font-medium leading-relaxed">
                                                  {
                                                    foodLogs[0].analysis
                                                      .impactOnBody
                                                  }
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col items-center justify-center h-96 text-black/40 border-2 border-dashed border-slate-100 rounded-none md:rounded-lg bg-slate-50/50">
                                          <Utensils className="w-16 h-16 mb-4 text-[#E9E9F3]" />
                                          <p className="text-lg font-medium text-black/60">
                                            Log meals to see your holistic trend
                                            analysis.
                                          </p>
                                          <p className="text-sm max-w-sm text-center mt-2">
                                            The AI maps your food choices
                                            against your baseline profile to
                                            estimate cardiovascular and physical
                                            outcomes.
                                          </p>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                </div>
                              </div>
                            </div>
                          </Drawer.Content>
                        </Drawer.Portal>
                      </Drawer.Root>
                    </div>

                    {/* Tab Content: Mood Tracker */}
                    <Drawer.Root
                      open={showMoodLogDrawer}
                      onOpenChange={setShowMoodLogDrawer}
                      direction="right"
                    >
                      <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
                        <Drawer.Content className="right-0 top-0 bottom-0 fixed z-[100] w-full md:w-[600px] flex outline-none bg-slate-50 border-l border-slate-200">
                          <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8">
                            <div className="flex justify-end mb-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowMoodLogDrawer(false)}
                                className="rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                            <div className="animate-in fade-in duration-500">
                              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                <Drawer.Title className="text-2xl font-bold text-black">
                                  {t("Mood & Somatic Tracking")}
                                </Drawer.Title>
                                {moodLogs.length > 0 && (
                                  <Button
                                    onClick={() => {
                                      handleSimulate();
                                      setActiveTab("timeline");
                                    }}
                                    disabled={!hasNewMoodLog || loading}
                                    className={`rounded-xl transition-all duration-500 scale-100 ${
                                      hasNewMoodLog
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white/30 ring-2 ring-emerald-500 ring-offset-2"
                                        : "bg-slate-100/50 text-slate-400 cursor-not-allowed border border-slate-200 hover:bg-slate-100/50"
                                    }`}
                                  >
                                    {loading ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Sparkles className="w-4 h-4 mr-2" />
                                    )}
                                    Update Projections
                                  </Button>
                                )}
                              </div>
                              <MoodTracking
                                moodLogs={moodLogs}
                                setHasNewMoodLog={setHasNewMoodLog}
                                userProfileContext={`Age: ${age}, Gender: ${gender}, Weight: ${weight}kg, Height: ${height}cm, BMI: ${bmi}, Activity Level: ${activityLevel}, Diet Quality: ${diet}, Smoking Status: ${smokingStatus}, Medical Conditions: ${diseaseConditions || "None"}, Stress: ${stressLevel}, Sleep: ${sleepQuality}`}
                                earnHealthTime={earnHealthTime}
                              />
                            </div>
                          </div>
                        </Drawer.Content>
                      </Drawer.Portal>
                    </Drawer.Root>

                    {/* Tab Content: Biomarker Tracking */}
                    <Drawer.Root
                      open={showBiomarkerDrawer}
                      onOpenChange={setShowBiomarkerDrawer}
                      direction="right"
                    >
                      <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
                        <Drawer.Content className="right-0 top-0 bottom-0 fixed z-[100] w-full md:w-[700px] flex outline-none bg-slate-50 border-l border-slate-200">
                          <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 md:p-8">
                            <div className="flex justify-end mb-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowBiomarkerDrawer(false)}
                                className="rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                            <div className="animate-in fade-in duration-500">
                              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                <Drawer.Title className="text-2xl font-bold text-black flex items-center">
                                  {t("Clinical Biomarkers Log")}
                                  <ModuleInfoDialog 
                                    title="Clinical Biomarker Tracking System"
                                    info={{
                                      purpose: "Extracts and categorizes structured clinical data from user-uploaded metabolic and lipid panel reports.",
                                      dataProcessing: "Uploaded images are processed directly via Gemini Vision API. Data is temporarily parsed, displayed, and saved in the user's localized database. No PHI is used for model training.",
                                      aiTransparency: "Utilizes Gemini multimodal models for OCR and entity extraction. Algorithmic outputs are deterministic mappings based on standard clinical reference ranges.",
                                      clinicalBoundaries: "This module serves strictly as an informational data organizer. It does not provide diagnoses or prescribe treatments. Divergence calculations are based on generalized health trajectory algorithms, not individualized medical advice."
                                    }}
                                  />
                                </Drawer.Title>
                                {biomarkerLogs.length > 0 && (
                                  <Button
                                    onClick={() => {
                                      handleSimulate();
                                      setActiveTab("timeline");
                                    }}
                                    disabled={loading}
                                    className="rounded-md transition-all duration-500 bg-indigo-600 hover:bg-indigo-700 text-white"
                                  >
                                    Sync & Recalculate Health Impact
                                  </Button>
                                )}
                              </div>
                              <BiomarkerTracking
                                biomarkerLogs={biomarkerLogs}
                                setHasNewBiomarkerLog={() => {}}
                                userProfileObject={{
                                  age,
                                  gender,
                                  diseaseConditions,
                                }}
                                earnHealthTime={earnHealthTime}
                              />
                            </div>
                          </div>
                        </Drawer.Content>
                      </Drawer.Portal>
                    </Drawer.Root>

                    <motion.div
                      variants={dashboardItemVariants}
                      className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                      <FutureLettersSection
                        userId={user.uid}
                        gamification={gamification!}
                        setGamification={
                          setGamification as React.Dispatch<
                            React.SetStateAction<any>
                          >
                        }
                        userProfile={{ age, gender, weight }}
                        simulations={simulations}
                        faceImage={faceImage}
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Footer Disclaimer */}
          <footer className="mt-16 text-center text-black/40 text-sm pb-8 max-w-3xl mx-auto px-4 no-print">
            <p className="mb-2">
              <strong className="text-black/60">Disclaimer:</strong> FutureSelf
              is an educational simulation tool, not a diagnostic medical
              device.
            </p>
            <p>
              The projections and images generated are based on AI models and
              general holistic health risk factors. Always consult with a
              qualified healthcare provider for medical advice and before
              starting any new diet or exercise program.
            </p>
          </footer>

          {/* Enlarged Image Modal */}
          <AnimatePresence>
            {enlargedImage && (
              <motion.div
                key="enlarged-img"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm cursor-pointer"
                onClick={() => setEnlargedImage(null)}
              >
                <motion.img
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  src={enlargedImage || undefined}
                  alt="Enlarged view"
                  className="max-w-full max-h-[90vh] rounded-none md:rounded-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showHcpModal && hcpReport && (
              <motion.div
                key="hcp-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
              >
                <div className="bg-white rounded-none md:rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 z-10 bg-white/50 backdrop-blur"
                    onClick={() => setShowHcpModal(false)}
                  >
                    <X className="w-5 h-5 text-slate-800" />
                  </Button>

                  {/* Left Side - The QR Code */}
                  <div className="md:w-1/3 bg-slate-50 p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-200 shrink-0">
                    <Stethoscope className="w-12 h-12 text-[#3D2B56] mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      HCP Access
                    </h3>
                    <p className="text-sm text-slate-600 mb-6">
                      Have your healthcare provider scan this code to draft a
                      direct email copy of this report.
                    </p>

                    <div className="bg-white p-4 rounded-none md:rounded-lg mb-6">
                      <QRCodeSVG
                        value={`mailto:provider@example.com?subject=Clinical Patient Report - FutureSelf Data&body=${encodeURIComponent(
                          hcpReport.length > 800
                            ? hcpReport.substring(0, 800) +
                                '\n\n... [Report Truncated for QR Size Limit. Please use the "Share via..." button for the full report]'
                            : hcpReport,
                        )}`}
                        size={200}
                        bgColor={"#ffffff"}
                        fgColor={"#3D2B56"}
                        level={"L"}
                      />
                    </div>

                    <div className="space-y-3 w-full">
                      <Button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(hcpReport);
                            alert("Copied to clipboard!");
                          } catch (err) {
                            console.error("Failed to copy", err);
                            alert(
                              "Failed to copy. Please select the text manually.",
                            );
                          }
                        }}
                        className="bg-[#3D2B56] text-white hover:bg-[#2A1E3C] w-full rounded-xl h-12"
                      >
                        <FileText className="w-4 h-4 mr-2" /> Copy Full Report
                      </Button>

                      <Button
                        onClick={() => {
                          handleGenerateHcpReport();
                        }}
                        disabled={generatingHcp}
                        variant="outline"
                        className="w-full text-[#3D2B56] border-[#3D2B56] hover:bg-slate-50 rounded-xl h-12"
                      >
                        {generatingHcp ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCcw className="w-4 h-4 mr-2" />
                        )}
                        {generatingHcp
                          ? "Regenerating..."
                          : "Regenerate Report"}
                      </Button>
                    </div>
                  </div>

                  {/* Right Side - The Report Markdown */}
                  <div className="md:w-2/3 p-8 overflow-y-auto bg-white article-prose">
                    <div
                      id="hcp-report-content"
                      className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-[#3D2B56] prose-h2:border-b-2 prose-h2:border-[#E9E9F3] prose-h2:pb-2 prose-h3:text-slate-800 prose-strong:text-[#4a3666] prose-li:marker:text-[#9081B1] prose-p:text-slate-600 prose-a:text-emerald-600 p-4"
                    >
                      <Markdown>{hcpReport}</Markdown>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PoC Disclaimer Modal */}
          <AnimatePresence>
            {showPocModal && (
              <motion.div
                key="poc-modal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="bg-white rounded-none md:rounded-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                  <div className="bg-amber-500 p-6 text-center flex-shrink-0 items-center justify-center flex flex-col">
                    <AlertTriangle className="w-16 h-16 text-white mb-2" />
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider">
                      Proof of Concept
                    </h2>
                  </div>
                  <div className="p-8 space-y-5 text-slate-700 leading-relaxed overflow-y-auto">
                    <p className="text-lg font-medium text-slate-900 border-b pb-4">
                      Welcome to{" "}
                      <strong className="text-[#3D2B56]">FutureSelf</strong>
                    </p>
                    <p>
                      Please note that this application is currently a{" "}
                      <strong>Proof of Concept (PoC)</strong> and is still in
                      active development.
                    </p>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3">
                      <div className="flex items-start bg-amber-100/80 p-3 rounded-lg border border-amber-200">
                        <div className="w-2 h-2 rounded-full bg-amber-600 mt-2 mr-3 shrink-0 animate-pulse"></div>
                        <p className="text-sm font-medium text-amber-950">
                          <strong>Optimal Experience:</strong> This application
                          is optimized for mobile devices in portrait
                          orientation and currently performs best in English.
                        </p>
                      </div>
                      <div className="flex items-start pl-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 mr-3 shrink-0"></div>
                        <p className="text-sm">
                          Data generated is based on predictive AI models and
                          may not be medically accurate.
                        </p>
                      </div>
                      <div className="flex items-start pl-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 mr-3 shrink-0"></div>
                        <p className="text-sm">
                          Features may be incomplete, and you might experience
                          bugs or unexpected behavior.
                        </p>
                      </div>
                      <div className="flex items-start pl-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 mr-3 shrink-0"></div>
                        <p className="text-sm">
                          This tool is for educational and demonstrative
                          purposes only, not for clinical diagnosis.
                        </p>
                      </div>
                    </div>
                    <p className="pt-2 font-semibold text-slate-900 text-center flex-shrink-0">
                      By continuing, you acknowledge the experimental nature of
                      this software.
                    </p>
                  </div>
                  <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0 flex justify-center">
                    <Button
                      onClick={() => {
                        setShowPocModal(false);
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-white/30 text-lg rounded-xl px-12 py-6 w-full font-bold uppercase tracking-wider transition-all hover:scale-105"
                    >
                      I Understand & Accept
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Persistent Navigation Toolbar (Globally Available) */}
          {simulations.length > 0 && !loading && (
            <motion.div
              layout
              className="fixed top-1/2 -translate-y-1/2 left-2 sm:left-4 z-[60] flex flex-col bg-white/30 backdrop-blur-xl rounded-none md:rounded-lg border border-white/30 overflow-visible"
            >
                <AnimatePresence initial={false}>
                  {!isToolbarCollapsed && (
                    <motion.div
                      key="toolbar-inner"
                      initial={{ opacity: 0, width: 0, height: 0 }}
                    animate={{ opacity: 1, width: "auto", height: "auto" }}
                    exit={{ opacity: 0, width: 0, height: 0 }}
                    className="flex flex-col items-center space-y-3 py-3 px-2 overflow-visible scrollbar-hide"
                  >
                    <div className="relative">
                      <Tooltip>
                        <TooltipTrigger
                          onClick={() => setShowSectionsMenu(!showSectionsMenu)}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                            showSectionsMenu
                              ? "bg-indigo-100 text-indigo-600"
                              : "hover:bg-indigo-100 text-slate-600 hover:text-indigo-600"
                          }`}
                        >
                          <Layers className="w-5 h-5" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-semibold text-sm">
                          Sections Menu
                        </TooltipContent>
                      </Tooltip>

                      <AnimatePresence>
                        {showSectionsMenu && (
                          <motion.div
                            key="sections-menu"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="absolute left-[calc(100%+16px)] top-0 w-48 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 py-2 z-[70] flex flex-col pointer-events-auto overflow-hidden"
                          >
                            <button
                              className="px-4 py-2 text-sm text-left hover:bg-slate-100/80 text-slate-700 flex items-center space-x-3 w-full transition-colors"
                              onClick={() => {
                                document.getElementById("section-top")?.scrollIntoView({ behavior: "smooth" });
                                setShowSectionsMenu(false);
                              }}
                            >
                              <ArrowUp className="w-4 h-4 text-slate-400" />
                              <span className="font-medium">Top</span>
                            </button>
                            <button
                              className="px-4 py-2 text-sm text-left hover:bg-slate-100/80 text-slate-700 flex items-center space-x-3 w-full transition-colors"
                              onClick={() => {
                                document.getElementById("section-timeline")?.scrollIntoView({ behavior: "smooth" });
                                setShowSectionsMenu(false);
                              }}
                            >
                              <Activity className="w-4 h-4 text-indigo-500" />
                              <span className="font-medium">Timeline</span>
                            </button>
                            <button
                              className="px-4 py-2 text-sm text-left hover:bg-slate-100/80 text-slate-700 flex items-center space-x-3 w-full transition-colors"
                              onClick={() => {
                                document.getElementById("section-metrics-insights")?.scrollIntoView({ behavior: "smooth" });
                                setShowSectionsMenu(false);
                              }}
                            >
                              <TrendingDown className="w-4 h-4 text-pink-500" />
                              <span className="font-medium">Metrics</span>
                            </button>
                            <button
                              className="px-4 py-2 text-sm text-left hover:bg-slate-100/80 text-slate-700 flex items-center space-x-3 w-full transition-colors"
                              onClick={() => {
                                document.getElementById("section-action-plan")?.scrollIntoView({ behavior: "smooth" });
                                setShowSectionsMenu(false);
                              }}
                            >
                              <Clipboard className="w-4 h-4 text-[#3D2B56]" />
                              <span className="font-medium">Action Plan</span>
                            </button>
                            <button
                              className="px-4 py-2 text-sm text-left hover:bg-slate-100/80 text-slate-700 flex items-center space-x-3 w-full transition-colors"
                              onClick={() => {
                                document.getElementById("section-letters")?.scrollIntoView({ behavior: "smooth" });
                                setShowSectionsMenu(false);
                              }}
                            >
                              <Mail className="w-4 h-4 text-purple-500" />
                              <span className="font-medium">Letters</span>
                            </button>
                            <div className="w-full h-px bg-slate-200/60 my-1" />
                            <button
                              className="px-4 py-2 text-sm text-left hover:bg-slate-100/80 text-slate-700 flex items-center space-x-3 w-full transition-colors"
                              onClick={() => {
                                window.dispatchEvent(new Event("start-onboarding-tour"));
                                setShowSectionsMenu(false);
                              }}
                            >
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">App Tour</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="w-full h-px bg-slate-200/60 my-1" />

                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => setShowFoodLogDrawer(true)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-emerald-100/80 text-slate-600 hover:text-emerald-600 transition-colors"
                      >
                        <Utensils className="w-5 h-5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold text-sm">
                        Log Meal
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => setShowMoodLogDrawer(true)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-amber-100/80 text-slate-600 hover:text-amber-600 transition-colors"
                      >
                        <Smile className="w-5 h-5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold text-sm">
                        Log Mood
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => setShowBiomarkerDrawer(true)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-red-100/80 text-slate-600 hover:text-red-600 transition-colors"
                      >
                        <Droplet className="w-5 h-5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold text-sm">
                        Log Biomarkers
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => window.dispatchEvent(new Event('open-advisor-chat'))}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-blue-100/80 text-slate-600 hover:text-blue-600 transition-colors"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold text-sm">
                        Wellbeing Advisor
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger
                        onClick={() => {
                          document.getElementById('section-notifications')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-rose-100/80 text-slate-600 hover:text-rose-600 transition-colors"
                      >
                        <Bell className="w-5 h-5" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-semibold text-sm">
                        Notifications
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex border-t border-slate-200/50 w-full justify-center">
                <Tooltip>
                  <TooltipTrigger
                    onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center hover:bg-slate-100/50 text-slate-500 hover:text-slate-800 transition-colors m-2 rounded-full"
                  >
                    {isToolbarCollapsed ? (
                      <ChevronRight className="w-5 h-5" />
                    ) : (
                      <ChevronLeft className="w-5 h-5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="font-semibold text-sm"
                  >
                    {isToolbarCollapsed ? "Expand Toolbar" : "Collapse Toolbar"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </motion.div>
          )}

          {/* AI Wellbeing Advisor Chat Widget */}
          <WellbeingAdvisorChat
            key={chatResetKey}
            isActive={
              simulations.length > 0 &&
              !loading &&
              !Object.values(generatingImages).some((v) => v) &&
              !generatingOptimizedImage
            }
            faceImage={faceImage}
            generatedImages={generatedImages}
            userContextSummary={`
User Profile:
- Chronological Age: ${age}
- Gender: ${gender}
- Height: ${height} cm
- Weight: ${weight} kg
- BMI: ${bmi}
- Activity Level: ${activityLevel}
- Diet Quality: ${diet}
- Smoking Status: ${smokingStatus}
- Existing Conditions: ${diseaseConditions || "None"}
- Stress Level: ${stressLevel}
- Sleep Quality: ${sleepQuality}

Recent Biomarkers:
- Total Cholesterol: ${totalCholesterol ?? "N/A"} (mg/dL)
- LDL: ${ldl ?? "N/A"} (mg/dL)
- HDL: ${hdl ?? "N/A"} (mg/dL)
- Lp(a): ${lpa ?? "N/A"} (mg/dL or nmol/L)
- Glucose (Random): ${randomGlucose ?? "N/A"} (mg/dL)
- HbA1c: ${hba1c ?? "N/A"} (%)
- BP Sys/Dia: ${bloodPressureSystolic ?? "N/A"}/${bloodPressureDiastolic ?? "N/A"} (mmHg)

Recent Biomarker Logs:
${biomarkerLogs
  .slice(0, 3)
  .map(
    (log) =>
      `- ${new Date(log.date).toDateString()}: TotChol ${log.totalCholesterol || "N/A"}, LDL ${log.ldl || "N/A"}, HDL ${log.hdl || "N/A"}, Gluc ${log.randomGlucose || "N/A"}. Analysis: ${log.analysis?.overallStatus || ""}`,
  )
  .join("\n")}

Recent Food logs:
${foodLogs
  .slice(0, 5)
  .map(
    (log) =>
      `- ${log.date}: ${Math.round(log.analysis.healthScore)}/100. ${log.analysis.details} Impact on Body: ${log.analysis.impactOnBody}, Heart: ${log.analysis.impactOnHeart}, Arteries: ${log.analysis.impactOnArteries}`,
  )
  .join("\n")}

Recent Mood & Somatic logs:
${moodLogs
  .slice(0, 5)
  .map(
    (log) =>
      `- ${log.date}: Mood ${log.emoji} (${log.intensity}/10), Stress ${log.stressLevel}/10, Sleep ${log.sleepHours} hrs. Pattern: ${log.analysis?.emotionalPattern}. Impact on Brain: ${log.analysis?.impactOnBrain}. Impact on Heart: ${log.analysis?.impactOnHeart}. Impact on Body: ${log.analysis?.impactOnBody}`,
  )
  .join("\n")}

Simulated Metrics (Current trajectory):
${simulations.map((sim) => `- In ${sim.timeframe}: Biological Age ${sim.biologicalAge}, Holistic Score ${sim.holisticHealthScore}, Organ Details (Body: ${sim.avatarState}, Heart Stress: ${sim.heartStress}/100, Artery Health: ${sim.arteryHealth}/100, Mental Wellbeing: ${sim.mentalWellbeing}/100)`).join("\n")}

Optimized Metrics (If user follows advice):
${optimizedSimulations.map((sim) => `- In ${sim.timeframe}: Biological Age ${sim.biologicalAge}, Holistic Score ${sim.holisticHealthScore}, Heart Stress ${sim.heartStress}/100, Artery Health ${sim.arteryHealth}/100, Mental Wellbeing: ${sim.mentalWellbeing}/100`).join("\n")}

Action Plan:
${actionPlan ? actionPlan : "No action plan generated yet. The user needs to 'Generate Health Projection' first to get an action plan."}
        `}
          />
        </div>
      </div>

      {/* Pop-up notifications */}
      <AnimatePresence>
        {showTimelineToast && (
          <motion.div
            key="timeline-toast"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-4 z-[100] bg-[#3D2B56] text-white p-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-sm"
          >
            <div className="bg-indigo-500/20 p-2 rounded-full">
              <Activity className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <p className="font-semibold text-sm">Timeline Ready</p>
              <p className="text-white/70 text-xs">Your visual time-lapse is fully processed.</p>
            </div>
          </motion.div>
        )}
        {showTakeControlToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-4 z-[100] bg-indigo-600 text-white p-4 rounded-xl shadow-2xl flex items-center space-x-3 max-w-sm"
          >
            <div className="bg-white/20 p-2 rounded-full">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">Optimized Future Ready</p>
              <p className="text-white/70 text-xs text-balance">The 'Take Control' prediction is completed.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
