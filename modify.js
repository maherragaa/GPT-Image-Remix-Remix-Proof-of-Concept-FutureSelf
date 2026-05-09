const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /              \{\/\* GAMIFICATION STATS \*\/\}[\s\S]*?<\/AnimatePresence>\n                <\/div>\n              \)\}/;

const match = content.match(regex);
if (!match) {
    console.error("Could not find gamification block!");
    process.exit(1);
}

const block = match[0];
content = content.replace(regex, "");

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

const targetEndMarker = `                          Crystal Lungs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>`;

const targetEndReplacement = `                          Crystal Lungs
                        </p>
                      </div>
                    </div>
                  </div>
                  </div>
                  {/* GAMIFICATION STATS INSERTED */}
                  <div className="flex items-center shrink-0 ml-4 pb-2">
${block}
                  </div>
                </div>`;

content = content.replace(targetMarker, targetReplacement);
content = content.replace(targetEndMarker, targetEndReplacement);

fs.writeFileSync('src/App.tsx', content);
console.log("Moved successfully.");
