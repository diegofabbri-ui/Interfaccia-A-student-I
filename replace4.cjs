const fs = require('fs');
const path = require('path');

const file = 'src/components/StudyDashboard.tsx';

const replacements = {
  'text-indigo-400': 'text-brand-primary',
  'text-indigo-900': 'text-brand-primary',
  'text-emerald-400': 'text-status-success',
  'bg-brand-secondary0/20': 'bg-brand-secondary',
  'border-indigo-500/30': 'border-brand-primary',
  'bg-indigo-600': 'bg-brand-primary',
  'shadow-indigo-600/20': 'shadow-elevation-card',
  'focus:border-indigo-500': 'focus:border-brand-primary',
  'focus:ring-indigo-200': 'focus:ring-brand-secondary',
  'hover:bg-indigo-700': 'hover:bg-brand-hover',
  'text-emerald-900': 'text-status-success',
  'bg-status-success-bg0': 'bg-status-success',
  'bg-zinc-200': 'bg-surface-interactive',
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
