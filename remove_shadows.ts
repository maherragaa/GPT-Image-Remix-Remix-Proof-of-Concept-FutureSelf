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
      content = content.replace(/rounded-2xl/g, 'rounded-none md:rounded-2xl');
      content = content.replace(/rounded-3xl/g, 'rounded-none md:rounded-3xl');
      fs.writeFileSync(fullPath, content);
    }
  }
}
replaceInDir('./src');
