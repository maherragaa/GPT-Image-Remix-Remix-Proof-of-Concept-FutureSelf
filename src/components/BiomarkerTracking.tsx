import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Droplet, Activity, Loader2, CheckCircle2, Zap } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, auth } from '../lib/localDb';
import { db } from '../lib/localDb';
import { BiomarkerLog } from '../App';
import { extractBiomarkers, analyzeBiomarkerLog } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { ModuleInfoDialog } from './ModuleInfoDialog';

export function BiomarkerTracking({ 
  biomarkerLogs, 
  setHasNewBiomarkerLog,
  userProfileObject,
  earnHealthTime
}: { 
  biomarkerLogs: BiomarkerLog[], 
  setHasNewBiomarkerLog: React.Dispatch<React.SetStateAction<boolean>>,
  userProfileObject: any,
  earnHealthTime?: (minutes: number, activityLog?: boolean, reason?: string) => void
}) {
  const { t, language } = useLanguage();
  const [isAdding, setIsAdding] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractionResult, setExtractionResult] = useState<{ extracted: any, found: string[], missing: string[] } | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalCholesterol, setTotalCholesterol] = useState<number | null>(null);
  const [ldl, setLdl] = useState<number | null>(null);
  const [hdl, setHdl] = useState<number | null>(null);
  const [lpa, setLpa] = useState<number | null>(null);
  const [randomGlucose, setRandomGlucose] = useState<number | null>(null);
  const [hba1c, setHba1c] = useState<number | null>(null);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState<number | null>(null);
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setIsExtracting(true);
        setExtractionResult(null);
        try {
          const extracted = await extractBiomarkers(base64, file.type, language);
          if (extracted) {
            const found: string[] = [];
            const missing: string[] = [];
            const keys = [
              { key: 'totalCholesterol', label: 'Total Cholesterol' },
              { key: 'ldl', label: 'LDL' },
              { key: 'hdl', label: 'HDL' },
              { key: 'lpa', label: 'Lp(a)' },
              { key: 'randomGlucose', label: 'Random Glucose' },
              { key: 'hba1c', label: 'HbA1c' },
              { key: 'bloodPressureSystolic', label: 'Systolic BP' },
              { key: 'bloodPressureDiastolic', label: 'Diastolic BP' }
            ];

            keys.forEach(k => {
              if (extracted[k.key as keyof typeof extracted] !== undefined && extracted[k.key as keyof typeof extracted] !== null) {
                found.push(`${k.label}: ${extracted[k.key as keyof typeof extracted]}`);
              } else {
                missing.push(k.label);
              }
            });

            setExtractionResult({ extracted, found, missing });
          }
        } catch (err) {
          console.error("Failed to extract biomarkers:", err);
        } finally {
          setIsExtracting(false);
          // e.target.value = ''; // Reset input to allow same file re-selection
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyExtraction = () => {
    if (!extractionResult) return;
    const ex = extractionResult.extracted;
    if (ex.totalCholesterol !== undefined && ex.totalCholesterol !== null) setTotalCholesterol(ex.totalCholesterol);
    if (ex.ldl !== undefined && ex.ldl !== null) setLdl(ex.ldl);
    if (ex.hdl !== undefined && ex.hdl !== null) setHdl(ex.hdl);
    if (ex.lpa !== undefined && ex.lpa !== null) setLpa(ex.lpa);
    if (ex.randomGlucose !== undefined && ex.randomGlucose !== null) setRandomGlucose(ex.randomGlucose);
    if (ex.hba1c !== undefined && ex.hba1c !== null) setHba1c(ex.hba1c);
    if (ex.bloodPressureSystolic !== undefined && ex.bloodPressureSystolic !== null) setBloodPressureSystolic(ex.bloodPressureSystolic);
    if (ex.bloodPressureDiastolic !== undefined && ex.bloodPressureDiastolic !== null) setBloodPressureDiastolic(ex.bloodPressureDiastolic);
    setExtractionResult(null);
  };

  const handleSaveLog = async () => {
    if (!auth.currentUser) return;
    
    if (auth.currentUser.isAnonymous) {
      alert('Note: As a guest, your biomarker logs will not be saved permanently. Please sign in to save your logs.');
      return;
    }
    
    // Check if at least one value is entered
    if ([totalCholesterol, ldl, hdl, lpa, randomGlucose, hba1c, bloodPressureSystolic, bloodPressureDiastolic].every(v => v === null)) {
      alert("Please enter at least one biomarker value.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const dataToSave = {
        totalCholesterol, ldl, hdl, lpa, randomGlucose, hba1c, bloodPressureSystolic, bloodPressureDiastolic
      };

      const analysis = await analyzeBiomarkerLog(userProfileObject, dataToSave, language as 'en' | 'ar');

      const logId = crypto.randomUUID();
      const newLog: BiomarkerLog = {
        id: logId,
        uid: auth.currentUser.uid,
        date: date,
        createdAt: new Date().toISOString(),
        totalCholesterol,
        ldl,
        hdl,
        lpa,
        randomGlucose,
        hba1c,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        analysis: analysis || { overallStatus: "Unable to complete detailed analysis." }
      };

      await setDoc(doc(db, 'biomarkerLogs', logId), newLog);

      // We should also update the main profile so simulations are aware of the latest variables!
      const profileRef = doc(db, 'profiles', auth.currentUser.uid);
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (totalCholesterol) updateData.totalCholesterol = totalCholesterol;
      if (ldl) updateData.ldl = ldl;
      if (hdl) updateData.hdl = hdl;
      if (lpa) updateData.lpa = lpa;
      if (randomGlucose) updateData.randomGlucose = randomGlucose;
      if (hba1c) updateData.hba1c = hba1c;
      if (bloodPressureSystolic) updateData.bloodPressureSystolic = bloodPressureSystolic;
      if (bloodPressureDiastolic) updateData.bloodPressureDiastolic = bloodPressureDiastolic;
      await updateDoc(profileRef, updateData);

      setHasNewBiomarkerLog(true);
      
      // Reset form
      setIsAdding(false);
      setTotalCholesterol(null); setLdl(null); setHdl(null); setLpa(null); 
      setRandomGlucose(null); setHba1c(null); setBloodPressureSystolic(null); setBloodPressureDiastolic(null);

      if (earnHealthTime) {
         earnHealthTime(60, true, "Logged Clinical Biomarkers"); 
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save log.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 h-full">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Droplet className="w-5 h-5 text-blue-500" />
              New Log Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
             {!isAdding ? (
               <div className="flex flex-col items-center justify-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                 <div className="bg-blue-100/50 p-4 rounded-full mb-4">
                   <Droplet className="w-8 h-8 text-blue-500" />
                 </div>
                 <h4 className="text-lg font-medium text-slate-800 mb-2">Track Biomarkers</h4>
                 <p className="text-slate-500 text-center text-sm mb-6 max-w-[250px]">Upload a recent lab result or enter metrics manually to continuously update your AI's health understanding.</p>
                 <Button onClick={() => setIsAdding(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                   <Plus className="w-4 h-4 mr-2" /> Add Lab Results
                 </Button>
               </div>
             ) : (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Dropzone Upload */}
                  <div className="p-4 bg-blue-50/40 rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center text-center gap-3 transition-colors hover:bg-blue-50/80">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      id="biomarker-log-upload" 
                      className="hidden" 
                      onChange={handleFileUpload}
                      onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                    />
                    <div className="text-slate-600 font-medium">Auto-Fill from Document</div>
                    <Button 
                      onClick={() => document.getElementById('biomarker-log-upload')?.click()} 
                      variant="outline" 
                      className="bg-white hover:bg-blue-50 text-blue-700 border-blue-200 h-9"
                      disabled={isExtracting}
                    >
                      {isExtracting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Plus className="w-4 h-4 mr-2" /> Upload Results file</>
                      )}
                    </Button>
                  </div>

                  {extractionResult && (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h5 className="font-medium text-green-800 mb-2 flex items-center text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Extracted successfully!
                      </h5>
                      {extractionResult.missing.length > 0 && (
                        <p className="text-xs text-amber-700 mb-3 bg-amber-50 p-2 rounded border border-amber-100">
                          <strong>Missing:</strong> {extractionResult.missing.join(', ')}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={applyExtraction} className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs h-8">
                          Confirm & Auto-Fill
                        </Button>
                        <Button size="sm" onClick={() => setExtractionResult(null)} variant="outline" className="border-green-200 text-green-700 hover:bg-green-100 text-xs h-8">
                           Discard
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5 col-span-2">
                       <Label className="text-xs font-bold text-slate-500 uppercase">Log Date</Label>
                       <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-white" />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">Tot. Chol (mg/dL)</Label>
                      <Input type="number" value={totalCholesterol || ''} onChange={(e) => setTotalCholesterol(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">LDL Chol (mg/dL)</Label>
                      <Input type="number" value={ldl || ''} onChange={(e) => setLdl(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">HDL Chol (mg/dL)</Label>
                      <Input type="number" value={hdl || ''} onChange={(e) => setHdl(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">Lp(a) (mg/dL)</Label>
                      <Input type="number" value={lpa || ''} onChange={(e) => setLpa(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">Glucose (mg/dL)</Label>
                      <Input type="number" value={randomGlucose || ''} onChange={(e) => setRandomGlucose(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">HbA1c (%)</Label>
                      <Input type="number" step="0.1" value={hba1c || ''} onChange={(e) => setHba1c(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">BP Sys (mmHg)</Label>
                      <Input type="number" value={bloodPressureSystolic || ''} onChange={(e) => setBloodPressureSystolic(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-500 uppercase truncate">BP Dia (mmHg)</Label>
                      <Input type="number" value={bloodPressureDiastolic || ''} onChange={(e) => setBloodPressureDiastolic(e.target.value ? Number(e.target.value) : null)} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      onClick={handleSaveLog} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving & Analyzing...</> : "Save Log"}
                    </Button>
                    <Button onClick={() => setIsAdding(false)} variant="ghost" disabled={isAnalyzing}>Cancel</Button>
                  </div>
               </motion.div>
             )}
          </CardContent>
        </Card>

        {/* History Stream */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 px-1">Recent Logs</h3>
          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 pt-1">
            <AnimatePresence>
              {biomarkerLogs.length === 0 && (
                <div className="text-center p-8 text-slate-500 bg-white/50 rounded-xl border border-white/20">
                   No reading history available. Add your first lab result to get started.
                </div>
              )}
              {biomarkerLogs.map((log) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl border border-slate-100 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <span className="font-medium text-slate-700">{new Date(log.date).toLocaleDateString()}</span>
                    {(log.bloodPressureSystolic || log.totalCholesterol || log.hba1c) && (
                       <span className="text-xs bg-white px-2 py-1 rounded-full border border-slate-200 text-slate-500 flex items-center">
                         <Activity className="w-3 h-3 mr-1 text-blue-500" />
                         Captured
                       </span>
                    )}
                  </div>
                  <div className="p-4 space-y-4 text-sm">
                    {/* Compact Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                       {log.totalCholesterol && <div className="bg-blue-50/50 p-2 rounded border border-blue-100"><div className="text-slate-500 font-medium">Tot. Chol</div><div className="text-slate-800">{log.totalCholesterol}</div></div>}
                       {log.ldl && <div className="bg-blue-50/50 p-2 rounded border border-blue-100"><div className="text-slate-500 font-medium">LDL</div><div className="text-slate-800">{log.ldl}</div></div>}
                       {log.hdl && <div className="bg-blue-50/50 p-2 rounded border border-blue-100"><div className="text-slate-500 font-medium">HDL</div><div className="text-slate-800">{log.hdl}</div></div>}
                       {log.randomGlucose && <div className="bg-amber-50/50 p-2 rounded border border-amber-100"><div className="text-slate-500 font-medium">Glucose</div><div className="text-slate-800">{log.randomGlucose}</div></div>}
                       {log.hba1c && <div className="bg-amber-50/50 p-2 rounded border border-amber-100"><div className="text-slate-500 font-medium">HbA1c</div><div className="text-slate-800">{log.hba1c}%</div></div>}
                       {log.bloodPressureSystolic && <div className="bg-rose-50/50 p-2 rounded border border-rose-100"><div className="text-slate-500 font-medium">BP</div><div className="text-slate-800">{log.bloodPressureSystolic}/{log.bloodPressureDiastolic}</div></div>}
                    </div>

                    {/* AI Analysis */}
                    {log.analysis && (
                      <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                        <p className="text-slate-700 leading-relaxed font-medium">"{log.analysis.overallStatus}"</p>
                        
                        {log.analysis.criticalAlerts && log.analysis.criticalAlerts.length > 0 && (
                          <div className="bg-red-50/80 p-3 rounded-lg border border-red-100">
                            <strong className="text-red-900 text-xs uppercase tracking-wider block mb-1.5">Critical Alerts</strong>
                            <ul className="list-disc pl-4 space-y-1 text-red-800 text-xs">
                              {log.analysis.criticalAlerts.map((a, i) => <li key={'ca'+i}>{a}</li>)}
                            </ul>
                          </div>
                        )}
                        
                        {log.analysis.improvements && log.analysis.improvements.length > 0 && (
                          <div className="bg-green-50/80 p-3 rounded-lg border border-green-100">
                            <strong className="text-green-900 text-xs uppercase tracking-wider block mb-1.5">Actionable Steps</strong>
                            <ul className="list-disc pl-4 space-y-1 text-green-800 text-xs">
                              {log.analysis.improvements.map((a, i) => <li key={'imp'+i}>{a}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
