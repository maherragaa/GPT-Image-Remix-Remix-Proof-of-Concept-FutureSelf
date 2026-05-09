import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, setDoc } from '../lib/localDb';
import { analyzeMood, generateWeeklyRecap } from '../services/geminiService';
import { Loader2, Smile, Meh, Frown, Brain, Activity, TrendingDown, Moon, Mic, Type, CalendarIcon, Hash, BarChart3, CloudRain } from 'lucide-react';
import { MoodLog } from '../App';
import { SomaticBodyMap } from './SomaticBodyMap';
import { ModuleInfoDialog } from './ModuleInfoDialog';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Markdown from 'react-markdown';

const COMMON_TRIGGERS = ['Work', 'Family', 'Workout', 'LackOfSleep', 'Weather', 'Finance', 'Diet', 'Relationship', 'Health'];

const PLUTCHIK_EMOTIONS = [
  { core: 'Joy', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '😊', subs: ['Happy', 'Excited', 'Optimistic', 'Proud', 'Peaceful', 'Content'] },
  { core: 'Trust', color: 'bg-green-100 text-green-800 border-green-300', icon: '🤝', subs: ['Accepting', 'Helpful', 'Supported', 'Secure'] },
  { core: 'Fear', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '😟', subs: ['Anxious', 'Insecure', 'Panicked', 'Overwhelmed', 'Worried'] },
  { core: 'Surprise', color: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: '😲', subs: ['Confused', 'Amazed', 'Startled', 'Overcome'] },
  { core: 'Sadness', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '😢', subs: ['Disappointed', 'Lonely', 'Grieving', 'Heartbroken', 'Pessimistic', 'Tired'] },
  { core: 'Disgust', color: 'bg-lime-100 text-lime-800 border-lime-300', icon: '🤢', subs: ['Contempt', 'Repelled', 'Disapproving', 'Sick'] },
  { core: 'Anger', color: 'bg-red-100 text-red-800 border-red-300', icon: '😡', subs: ['Annoyed', 'Frustrated', 'Resentful', 'Furious', 'Bitter'] },
  { core: 'Anticipation', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🤔', subs: ['Expectant', 'Curious', 'Vigilant', 'Hopeful'] },
];

export function MoodTracking({ moodLogs, setHasNewMoodLog, userProfileContext, earnHealthTime }: { moodLogs: MoodLog[], setHasNewMoodLog: (v: boolean) => void, userProfileContext: string, earnHealthTime?: (minutes: number, activityLog?: boolean, reason?: string) => void }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  const [analyzing, setAnalyzing] = useState(false);
  const [activeCoreLayer, setActiveCoreLayer] = useState<string>('Joy');
  const [selectedSubEmotion, setSelectedSubEmotion] = useState<string>('Happy');
  
  const [intensity, setIntensity] = useState<number>(5);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [somaticLocations, setSomaticLocations] = useState<string[]>([]);
  
  const [isRecordingMood, setIsRecordingMood] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      let speechLang = 'en-US';
      if (language === 'Arabic') speechLang = 'ar-SA';
      recognition.lang = speechLang;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setNotes(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error in mood', event.error);
        setIsRecordingMood(false);
      };

      recognition.onend = () => {
        setIsRecordingMood(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleMoodRecording = () => {
    if (isRecordingMood) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        setNotes("");
        recognitionRef.current.start();
        setIsRecordingMood(true);
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const toggleSomaticPart = (part: string) => {
    setSomaticLocations(prev => 
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const getEmojiForSub = () => {
    const core = PLUTCHIK_EMOTIONS.find(e => e.core === activeCoreLayer);
    return core?.icon || '🙂';
  };

  const handleLogMood = async () => {
    if (!user) return;
    
    // @ts-ignore
    if (user.isAnonymous) {
      alert('Note: As a guest, your mood logs will not be saved permanently. Please sign in to save your logs.');
      return;
    }

    setAnalyzing(true);
    
    try {
      const fullContextNotes = `${notes}\nTriggers: ${selectedTriggers.join(', ')}`;
      const emoji = getEmojiForSub();
      const analysis = await analyzeMood(emoji, activeCoreLayer, selectedSubEmotion, somaticLocations, intensity, stressLevel, sleepHours, fullContextNotes, userProfileContext, language);
      const newLogId = crypto.randomUUID();
      
      const newLog: MoodLog = {
        uid: user.uid,
        id: newLogId,
        date: new Date().toISOString(),
        emoji: emoji,
        coreEmotion: activeCoreLayer,
        subEmotion: selectedSubEmotion,
        somaticLocations,
        intensity,
        stressLevel,
        sleepHours,
        notes,
        triggers: selectedTriggers,
        createdAt: new Date().toISOString(),
        analysis
      };

      await setDoc(doc(db, 'moodLogs', newLogId), newLog);
      
      setHasNewMoodLog(true);
      setNotes('');
      // Streaks Logic & Rewards
      if (earnHealthTime) {
        const d = new Date();
        const last7DaysLogs = moodLogs.filter(l => (d.getTime() - new Date(l.date).getTime()) < 7 * 24 * 3600 * 1000);
        const uniqueEmotions = new Set([...last7DaysLogs.map(l => l.coreEmotion), activeCoreLayer].filter(Boolean));
        
        if (stressLevel < 5 && intensity > 5) {
          earnHealthTime(30, true, "Positive Mood State Logged");
        } else {
          earnHealthTime(10, true, "Logged Mood & Emotion State");
        }
        
        // Bonus for emotional diversity (requires logging different core emotions over a week - signifying honesty)
        if (uniqueEmotions.size >= 4) {
          earnHealthTime(20, true, "Emotional Honesty & Granularity Bonus");
        }
      }
    } catch (err) {
      console.error(err);
      alert(t('Failed to analyze mood. Please try again.'));
    } finally {
      setAnalyzing(false);
    }
  };

  // Recharts Data Prep
  const sleepVsStressData = useMemo(() => {
    return moodLogs.map(log => ({
      date: new Date(log.date).toLocaleDateString(),
      sleep: log.sleepHours,
      stress: log.stressLevel,
      label: log.emoji
    })).slice(0, 30);
  }, [moodLogs]);

  const triggerHeatmapData = useMemo(() => {
    const triggerMap: Record<string, { totalStress: number, count: number }> = {};
    moodLogs.forEach(log => {
      if (log.triggers) {
        log.triggers.forEach(tr => {
          if (!triggerMap[tr]) triggerMap[tr] = { totalStress: 0, count: 0 };
          triggerMap[tr].totalStress += log.stressLevel;
          triggerMap[tr].count += 1;
        });
      }
    });
    return Object.entries(triggerMap).map(([name, data]) => ({
      name,
      avgStress: data.totalStress / data.count,
      count: data.count
    })).sort((a,b) => b.avgStress - a.avgStress).slice(0, 5);
  }, [moodLogs]);

  const [generatingRecap, setGeneratingRecap] = useState(false);
  const [weeklyRecap, setWeeklyRecap] = useState("");

  const handleGenerateRecap = async () => {
    setGeneratingRecap(true);
    try {
      const recap = await generateWeeklyRecap(moodLogs, userProfileContext, language);
      setWeeklyRecap(recap);
    } catch (e) {
      setWeeklyRecap("Failed to generate recap.");
    } finally {
      setGeneratingRecap(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Col: Logging */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="border border-slate-200 rounded-none md:rounded-lg bg-white">
          <CardContent className="p-4 md:p-6">
            <div className="mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <h3 className="text-xl font-bold text-slate-800">{t('Emotional & Somatic Check-In')}</h3>
                <ModuleInfoDialog 
                  title="Psycho-Somatic Event Logging"
                  info={{
                    purpose: "Captures emotional granularity based on Plutchik's Wheel of Emotions, correlating physiological responses (sleep, stress) with emotional states.",
                    dataProcessing: "User inputs (sliders, body map selections, text notes) are stored locally. Voice inputs are transcribed locally via Web Speech API.",
                    aiTransparency: "Sentiment analysis and biological impact correlations are generated via LLM prompt engineering, framing the AI as a pattern-recognition analytical tool.",
                    clinicalBoundaries: "Not a psychiatric diagnostic tool. Detects 'Burnout Risks' based on generalized algorithmic heuristics. Does not replace clinical psychological assessment or crisis intervention."
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-8">
              {/* Plutchik's Core -> Sub Selection */}
              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-3 block">{t('Primary Emotion')}</Label>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PLUTCHIK_EMOTIONS.map(emo => (
                    <button
                      key={emo.core}
                      onClick={() => { setActiveCoreLayer(emo.core); setSelectedSubEmotion(emo.subs[0]); }}
                      className={`py-2 flex flex-col items-center justify-center rounded-xl border-2 transition-all ${activeCoreLayer === emo.core ? emo.color : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}`}
                    >
                      <span className="text-2xl mb-1">{emo.icon}</span>
                      <span className="text-[10px] font-bold">{emo.core}</span>
                    </button>
                  ))}
                </div>
                {activeCoreLayer && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="text-xs font-bold text-black/40 uppercase tracking-wider mb-2 block">{t('Drill Down. I feel...')}</Label>
                    <div className="flex flex-wrap gap-2">
                      {PLUTCHIK_EMOTIONS.find(e => e.core === activeCoreLayer)?.subs.map(sub => (
                        <button
                          key={sub}
                          onClick={() => setSelectedSubEmotion(sub)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                            selectedSubEmotion === sub 
                              ? 'bg-[#3D2B56] text-white' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Somatic Mapping */}
              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-3 block">{t('Where do you feel it physically?')}</Label>
                <div className="bg-slate-50 p-4 pt-6 rounded-xl border border-slate-100">
                  <SomaticBodyMap selectedParts={somaticLocations} togglePart={toggleSomaticPart} />
                  {somaticLocations.length > 0 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-1.5">
                      {somaticLocations.map(part => (
                        <span key={part} className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase">
                          {part}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-2 flex items-center justify-between">
                  {t('Mood Intensity')} <span className="text-[#3D2B56]">{intensity}/10</span>
                </Label>
                <Slider value={[intensity]} onValueChange={v => setIntensity(v[0])} min={1} max={10} step={1} className="py-4" />
              </div>

              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-2 flex items-center justify-between">
                  {t('Stress Level')} <span className="text-[#3D2B56]">{stressLevel}/10</span>
                </Label>
                <Slider value={[stressLevel]} onValueChange={v => setStressLevel(v[0])} min={1} max={10} step={1} className="py-4" />
              </div>

              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-2 flex items-center justify-between">
                  {t('Sleep Hours')} <span className="text-[#3D2B56]">{sleepHours} {t('hrs')}</span>
                </Label>
                <Slider value={[sleepHours]} onValueChange={v => setSleepHours(v[0])} min={0} max={12} step={0.5} className="py-4" />
              </div>

              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-3 flex items-center"><Hash className="w-4 h-4 mr-1"/> {t('Context Triggers')}</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TRIGGERS.map(trigger => (
                    <button
                      key={trigger}
                      onClick={() => toggleTrigger(trigger)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedTriggers.includes(trigger) 
                          ? 'bg-[#3D2B56] text-white' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      #{t(trigger)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-bold text-black/40 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{t('Any notes?')}</span>
                  <button 
                    onClick={toggleMoodRecording}
                    className={`p-1.5 rounded-full transition-colors flex items-center space-x-1 ${
                      isRecordingMood ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                    title="Audio Journaling"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">{isRecordingMood ? t('Recording...') : t('Voice Sentiment Enabled')}</span>
                  </button>
                </Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("What's contributing to your mood today? The AI will analyze sentiment.")}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#9081B1]/50 resize-none h-24"
                />
              </div>

              <Button
                onClick={handleLogMood}
                disabled={analyzing}
                className="w-full bg-[#3D2B56] hover:bg-[#2A1E3C] text-white py-6 rounded-xl"
              >
                {analyzing ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('Analyzing bio-impact...')}</> : t('Log Mood & Analyze')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Col: History & Insights */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="border border-slate-200 rounded-none md:rounded-lg bg-white h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#9081B1]/10 rounded-full blur-3xl -mx-20 -my-20"></div>
          <CardContent className="p-4 md:p-8 relative z-10">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-indigo-500"/> {t('Advanced Analytics & Insights')}</h3>
            
            {moodLogs.length > 0 ? (
              <div className="space-y-8">
                {/* Visual History Timeline */}
                <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                  {moodLogs.map((log, idx) => (
                    <div key={idx} className="flex-shrink-0 flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">
                        {log.emoji}
                      </div>
                      <span className="text-[10px] text-black/40 font-bold uppercase tracking-wider">
                        {new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Scatter Plot: Sleep vs Stress */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="text-xs font-bold text-[#3D2B56] uppercase tracking-wider block mb-4">{t('Biological Threshold (Sleep vs. Stress)')}</Label>
                    <div className="h-[200px] w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis type="number" dataKey="sleep" name="Sleep (hrs)" domain={[0, 12]} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <YAxis type="number" dataKey="stress" name="Stress" domain={[0, 10]} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter name="Logs" data={sleepVsStressData} fill="#8b5cf6" />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 italic text-center">See how your stress spikes when sleep drops below your baseline.</p>
                  </div>

                  {/* Trigger Heatmap */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <Label className="text-xs font-bold text-[#3D2B56] uppercase tracking-wider block mb-4">{t('Top Triggers x Average Stress')}</Label>
                    <div className="h-[200px] w-full text-xs">
                      {triggerHeatmapData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={triggerHeatmapData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" domain={[0, 10]} hide />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip />
                            <Bar dataKey="avgStress" fill="#fb7185" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">Not enough trigger data</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Latest Analysis Panel */}
                <div className="bg-white rounded-none md:rounded-lg p-6 border border-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-500"></div>
                  
                  <div className="mb-6 flex justify-between items-start">
                    <div>
                        <Label className="text-sm font-bold text-[#3D2B56] block mb-1">{t('Latest Clinical Breakdown')}</Label>
                        <p className="text-black/80 font-medium leading-relaxed">{moodLogs[0].analysis?.emotionalPattern}</p>
                    </div>
                    <div className="text-5xl ml-4 drop-">{moodLogs[0].emoji}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <h5 className="font-semibold text-[#3D2B56] flex items-center mb-2 text-sm"><Brain className="w-4 h-4 mr-2"/> {t('Cognitive')}</h5>
                      <p className="text-xs text-black/70 leading-relaxed">{moodLogs[0].analysis?.impactOnBrain}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <h5 className="font-semibold text-[#3D2B56] flex items-center mb-2 text-sm"><Activity className="w-4 h-4 mr-2"/> {t('Cardiovascular')}</h5>
                      <p className="text-xs text-black/70 leading-relaxed">{moodLogs[0].analysis?.impactOnHeart}</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      <h5 className="font-semibold text-[#3D2B56] flex items-center mb-2 text-sm"><TrendingDown className="w-4 h-4 mr-2"/> {t('Systemic')}</h5>
                      <p className="text-xs text-black/70 leading-relaxed">{moodLogs[0].analysis?.impactOnBody}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                    <div className="flex justify-between items-start mb-2">
                       <Label className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center"><CloudRain className="w-3 h-3 mr-1"/>{t('Actionable & Somatic Recommendation')}</Label>
                       {moodLogs[0].analysis?.sentiment && (
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                           moodLogs[0].analysis?.sentiment === 'Burnout Risk' ? 'bg-red-200 text-red-800' : 
                           moodLogs[0].analysis?.sentiment === 'Negative' ? 'bg-amber-100 text-amber-800' :
                           'bg-emerald-100 text-emerald-800'
                         }`}>
                           {moodLogs[0].analysis.sentiment} Detected
                         </span>
                       )}
                    </div>
                    <p className="text-sm text-indigo-900/80">{moodLogs[0].analysis?.recommendation}</p>
                  </div>

                  <div className="mt-6 border-t border-indigo-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-sm font-bold text-[#3D2B56]">{t('Weekly Recap')}</Label>
                      <Button 
                        disabled={generatingRecap}
                        onClick={handleGenerateRecap}
                        variant="outline"
                        size="sm" 
                        className="text-xs rounded-full border-indigo-200 hover:bg-indigo-50"
                      >
                        {generatingRecap ? <Loader2 className="w-3 h-3 mr-2 animate-spin"/> : <Brain className="w-3 h-3 mr-2 text-indigo-500" />}
                        {t('Generate Weekly Review')}
                      </Button>
                    </div>
                    {weeklyRecap && (
                      <div className="bg-slate-50/50 p-6 rounded-2xl border border-indigo-100/50 mt-4 prose prose-sm max-w-none prose-headings:text-[#3D2B56] prose-headings:font-bold prose-p:text-slate-700 prose-li:text-slate-700 prose-strong:text-indigo-900 overflow-hidden">
                        <Markdown>{weeklyRecap}</Markdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-black/40 border-2 border-dashed border-slate-200/50 rounded-none md:rounded-lg bg-slate-50/30">
                <Brain className="w-16 h-16 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-600">{t('Log moods to see your cognitive and systemic trends.')}</p>
                <p className="text-sm max-w-sm text-center mt-2">{t('The AI maps your psychological state to your physiological health.')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
