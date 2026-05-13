import fs from 'fs';
const file = 'src/services/geminiService.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/gemini-3.1-flash-lite-preview/g, 'gemini-3.1-flash-lite');
fs.writeFileSync(file, content);
console.log('Replaced successfully');
