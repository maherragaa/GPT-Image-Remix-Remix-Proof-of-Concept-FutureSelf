const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Find the block
const startMarker = "              {/* GAMIFICATION STATS */}";
const endMarker = "              )}";

const lines = content.split('\n');
const startIdx = lines.findIndex(l => l === startMarker);
let endIdx = -1;

// search forward
let closingTags = 0;
for(let i = startIdx + 1; i < lines.length; i++) {
  if (lines[i].includes('</AnimatePresence>')) {
      // The end is 2 lines after this
      endIdx = i + 2;
      break;
  }
}

if (startIdx === -1 || endIdx === -1) {
  console.log("Could not find block", startIdx, endIdx);
  process.exit(1);
}

const blockToMove = lines.slice(startIdx, endIdx + 1).join('\n');
console.log("Extracted block of size:", blockToMove.length);

// Remove the block
lines.splice(startIdx, endIdx - startIdx + 1);
content = lines.join('\n');

// Find the insertion point
// "                {/* Badges Separated Row */}"
const insertMarker1 = "                <div className=\"mt-4 pt-3 border-t border-slate-100 flex items-center justify-between overflow-x-auto scrollbar-hide\">";
const insertIdx1 = content.split('\n').findIndex(l => l === insertMarker1);

if (insertIdx1 !== -1) {
    const newLines = content.split('\n');
    // Change flex items-center to flex flex-wrap items-center gap-4
    newLines[insertIdx1] = "                <div className=\"mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 overflow-x-auto scrollbar-hide\">";
    
    // We want to insert the block right before the closing div of "Badges Separated Row"
    // Let's find the closing div
    // It's structure:
    //                 <div className="mt-4 pt-3 ...">
    //                   <div className="text-[10px] ... mr-4">Evolution Badges</div>
    //                   <div className="flex items-center space-x-6 whitespace-nowrap">
    //                     ...
    //                   </div>
    //                 </div>
    // So the closing div is the one aligning at column 16 (16 spaces)
    let insertAt = insertIdx1 + 1;
    for (let i = insertIdx1 + 1; i < newLines.length; i++) {
        if (newLines[i] === "                </div>") {
            insertAt = i;
            break;
        }
    }
    
    // But wait! We need to wrap the badges themselves in a div so they stay on the left.
    newLines.splice(insertIdx1 + 1, 0, "                  <div className=\"flex items-center\">");
    
    // find end of inner badges div which aligns at 18
    let badgesEndAt = -1;
    for (let i = insertIdx1 + 2; i < newLines.length; i++) {
        if (newLines[i] === "                  </div>") {
            badgesEndAt = i;
            break;
        }
    }
    
    newLines.splice(badgesEndAt + 1, 0, "                  </div>");
    
    // Now insert the gamification block
    newLines.splice(badgesEndAt + 2, 0, blockToMove);
    
    fs.writeFileSync('src/App.tsx', newLines.join('\n'));
    console.log("Moved successfully.");
} else {
    console.log("Could not find insertion marker");
}
