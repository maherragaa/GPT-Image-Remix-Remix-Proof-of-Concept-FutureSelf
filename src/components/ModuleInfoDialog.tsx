import React from 'react';
import { Info, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

export interface RegulatoryInfo {
  purpose: string;
  dataProcessing: string;
  aiTransparency?: string;
  clinicalBoundaries: string;
}

export function ModuleInfoDialog({ title, info }: { title: string, info: RegulatoryInfo }) {
  return (
    <Dialog>
      <DialogTrigger
        className="ml-2 p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors flex-shrink-0 inline-flex items-center justify-center cursor-pointer"
        title="Regulatory & Scientific Information"
      >
        <Info className="w-4 h-4" />
      </DialogTrigger>

      <DialogContent 
        showCloseButton={false} 
        className="w-[90%] max-w-lg rounded-none md:rounded-lg p-6 bg-white z-[100000]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-2 text-[#3D2B56]">
            <Info className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-lg m-0">{title}</h3>
          </div>
          <DialogClose 
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </DialogClose>
        </div>
        
        <div className="bg-slate-50 rounded-xl p-4 mb-2 overflow-y-auto pr-2 space-y-4 text-left max-h-[60vh] overscroll-contain">
          <section>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Purpose & Functionality</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{info.purpose}</p>
          </section>
          <section>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">Data Processing & Privacy</h4>
            <p className="text-slate-600 text-sm leading-relaxed">{info.dataProcessing}</p>
          </section>
          {info.aiTransparency && (
            <section>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">AI & Algorithmic Transparency</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{info.aiTransparency}</p>
            </section>
          )}
          <section>
            <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">Clinical Boundaries (SaMD Status)</h4>
            <p className="text-indigo-900/80 text-sm leading-relaxed">{info.clinicalBoundaries}</p>
          </section>
        </div>

        <div className="mt-4 flex justify-end">
          <DialogClose className="px-6 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors cursor-pointer">
            Acknowledge
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
