import fs from 'fs';

function replaceInDir(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');

      content = content.replace(/rounded-none md:rounded-3xl/g, '_TEMP_R3_');
      content = content.replace(/rounded-none md:rounded-2xl/g, '_TEMP_R2_');
      
      content = content.replace(/rounded-3xl/g, 'rounded-xl');
      content = content.replace(/rounded-2xl/g, 'rounded-lg');
      content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
      
      content = content.replace(/_TEMP_R3_/g, 'rounded-none md:rounded-xl');
      content = content.replace(/_TEMP_R2_/g, 'rounded-none md:rounded-lg');

      content = content.replace(/border-none/g, 'border border-slate-200');
      
      content = content.replace(/bg-\[\#E9E9F3\]/g, 'bg-slate-50');

      fs.writeFileSync(fullPath, content);
    }
  }
}
replaceInDir('./src');
