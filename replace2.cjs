const fs = require('fs');
const path = require('path');

const files = [
  'src/components/DevelopExamView.tsx',
  'src/components/ProfessorsView.tsx',
  'src/components/ExamHistoryView.tsx',
  'src/components/StudyDashboard.tsx'
];

const replacements = {
  'bg-surface-primary p-8 rounded-widget shadow-elevation-card border border-border-subtle': 'glass-panel p-8 rounded-widget shadow-elevation-card',
  'bg-surface-primary p-6 rounded-widget shadow-elevation-card border border-border-subtle': 'glass-panel p-6 rounded-widget shadow-elevation-card',
  'bg-surface-primary border border-border-subtle rounded-3xl p-8 shadow-elevation-card': 'glass-panel rounded-3xl p-8 shadow-elevation-card',
  'bg-surface-primary border border-border-subtle rounded-3xl shadow-elevation-card': 'glass-panel rounded-3xl shadow-elevation-card',
  'bg-surface-primary rounded-3xl shadow-2xl': 'glass-panel rounded-3xl shadow-elevation-floating',
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
