const fs = require('fs');
const path = require('path');

const file = 'src/components/DevelopExamView.tsx';

const replacements = {
  'focus:ring-indigo-500': 'focus:ring-brand-secondary',
  'focus:border-indigo-500': 'focus:border-brand-primary',
  'focus:ring-emerald-500': 'focus:ring-status-success-bg',
  'focus:border-emerald-500': 'focus:border-status-success',
};

const filePath = path.join(__dirname, file);
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of Object.entries(replacements)) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
