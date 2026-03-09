const fs = require('fs');
const path = require('path');

const file = 'src/components/StudyDashboard.tsx';

const replacements = {
  'bg-status-danger-bg border border-red-200 text-red-700': 'bg-status-danger-bg border border-status-danger text-status-danger',
  'text-amber-600': 'text-status-warning',
  'bg-amber-50': 'bg-status-warning-bg',
  'border-amber-200': 'border-status-warning',
  'hover:bg-red-200 text-status-danger': 'hover:bg-status-danger text-status-danger',
  'text-amber-700': 'text-status-warning',
  'bg-amber-100': 'bg-status-warning-bg',
  'bg-red-100': 'bg-status-danger-bg',
  'text-red-600': 'text-status-danger',
  'text-red-400': 'text-status-danger',
  'bg-blue-100': 'bg-status-info-bg',
  'text-blue-600': 'text-status-info',
  'text-blue-400': 'text-status-info',
  'text-blue-200': 'text-status-info',
  'hover:text-blue-600': 'hover:text-status-info',
  'bg-purple-100': 'bg-brand-secondary',
  'text-purple-600': 'text-brand-primary',
  'text-purple-400': 'text-brand-primary',
  'hover:text-purple-600': 'hover:text-brand-primary',
  'bg-status-danger-bg0/20': 'bg-status-danger-bg',
  'border-red-500/30': 'border-status-danger',
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
