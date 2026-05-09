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

      content = content.replace(/className=(["`][^"`]*rounded-(xl|2xl|3xl|full)[^"`]*["`])/g, (match) => {
        // We want to target buttons specifically. Usually they have hover:, bg-, text-white etc
        if (match.includes('bg-') && match.includes('text-white') && !match.includes('w-') && match.includes('hover:')) {
          return match.replace(/rounded-(xl|2xl|3xl|full)/g, 'rounded-md');
        }
        return match;
      });

      fs.writeFileSync(fullPath, content);
    }
  }
}
replaceInDir('./src');
