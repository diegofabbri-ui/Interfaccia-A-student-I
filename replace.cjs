const fs = require('fs');
const path = require('path');

const files = [
  'src/components/DevelopExamView.tsx',
  'src/components/ProfessorsView.tsx',
  'src/components/ExamHistoryView.tsx',
  'src/components/StudyDashboard.tsx'
];

const replacements = {
  'bg-white': 'bg-surface-primary',
  'bg-zinc-50': 'bg-bg-base',
  'text-zinc-900': 'text-text-primary',
  'text-zinc-500': 'text-text-secondary',
  'text-zinc-700': 'text-text-primary',
  'text-zinc-400': 'text-text-secondary',
  'text-zinc-600': 'text-text-secondary',
  'border-zinc-200': 'border-border-subtle',
  'border-zinc-300': 'border-border-subtle',
  'bg-indigo-100': 'bg-brand-secondary',
  'text-indigo-600': 'text-brand-primary',
  'text-indigo-700': 'text-brand-primary',
  'bg-indigo-50': 'bg-brand-secondary',
  'border-indigo-100': 'border-border-subtle',
  'border-indigo-200': 'border-border-subtle',
  'bg-emerald-100': 'bg-status-success-bg',
  'text-emerald-600': 'text-status-success',
  'bg-emerald-50': 'bg-status-success-bg',
  'text-emerald-700': 'text-status-success',
  'border-emerald-200': 'border-status-success',
  'bg-zinc-900': 'bg-brand-primary',
  'hover:bg-zinc-800': 'hover:bg-brand-hover',
  'bg-emerald-600': 'bg-status-success',
  'hover:bg-emerald-700': 'hover:bg-status-success',
  'shadow-sm': 'shadow-elevation-card',
  'rounded-2xl': 'rounded-widget',
  'rounded-xl': 'rounded-widget',
  'rounded-lg': 'rounded-button',
  'text-red-500': 'text-status-danger',
  'text-emerald-500': 'text-status-success',
  'bg-zinc-100': 'bg-surface-interactive',
  'hover:bg-zinc-100': 'hover:bg-surface-interactive-hover',
  'hover:bg-zinc-50': 'hover:bg-surface-interactive',
  'border-zinc-100': 'border-border-subtle',
  'bg-zinc-800': 'bg-brand-hover',
  'text-zinc-800': 'text-text-primary',
  'text-zinc-300': 'text-text-secondary',
  'bg-red-50': 'bg-status-danger-bg',
  'hover:text-red-600': 'hover:text-status-danger',
  'hover:bg-red-50': 'hover:bg-status-danger-bg',
  'text-zinc-700': 'text-text-primary',
};

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of Object.entries(replacements)) {
      content = content.split(search).join(replace);
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
