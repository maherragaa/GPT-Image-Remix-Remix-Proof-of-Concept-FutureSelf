const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const startMarker = "              {/* GAMIFICATION STATS */}";
const endMarker = "                  </AnimatePresence>\n                </div>\n              )}";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker, startIdx);

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find gamification stats block");
    process.exit(1);
}

const blockFullLen = (endIdx + endMarker.length) - startIdx;
const block = content.substring(startIdx, startIdx + blockFullLen);

content = content.substring(0, startIdx) + content.substring(startIdx + blockFullLen);

const targetMarker = `                {/* Badges Separated Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between overflow-x-auto scrollbar-hide">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-4">
                    Evolution Badges
                  </div>
                  <div className="flex items-center space-x-6 whitespace-nowrap">`;

const targetReplacement = `                {/* Badges Separated Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between overflow-x-auto scrollbar-hide">
                  <div className="flex items-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-4">
                      Evolution Badges
                    </div>
                    <div className="flex items-center space-x-6 whitespace-nowrap">`;

const targetEndMarker = `                      </div>
                    </div>
                  </div>
                </div>`;

const targetEndReplacement = `                      </div>
                    </div>
                  </div>
                  </div>
                  {/* Inserted GAMIFICATION STATS */}
                  <div className="flex items-center shrink-0 ml-4">
${block}
                  </div>
                </div>`;

content = content.replace(targetMarker, targetReplacement);
content = content.replace(targetEndMarker, targetEndReplacement);

fs.writeFileSync('src/App.tsx', content);
console.log("Moved gamification block successfully!");
