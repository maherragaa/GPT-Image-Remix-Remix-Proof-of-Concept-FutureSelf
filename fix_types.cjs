const fs = require('fs');
let content = fs.readFileSync('src/services/geminiService.ts', 'utf8');

// Replace types
content = content.replace(/type: "STRING"/g, 'type: Type.STRING');
content = content.replace(/type: "NUMBER"/g, 'type: Type.NUMBER');
content = content.replace(/type: "ARRAY"/g, 'type: Type.ARRAY');
content = content.replace(/type: "OBJECT"/g, 'type: Type.OBJECT');

// Prompt update 1
content = content.replace(
  '- metricComments: An object with ONE sentence explaining EACH metric (including holisticHealthScore and biologicalAge). Format: "Normal: [Range]. Reason: [Why]. Action: [What to do]."',
  '- metricComments: An object where EACH key is the EXACT metric name (like holisticHealthScore, biologicalAge, heartStress, arteryHealth, overallRisk, mentalWellbeing, cognitiveFunction, inflammationLevel, cellularAging, insulinResistance) and its value is ONE sentence explaining that specific metric. Format for EACH metric: "Normal: [Range]. Reason: [Why]. Action: [What to do]."'
);

fs.writeFileSync('src/services/geminiService.ts', content);
