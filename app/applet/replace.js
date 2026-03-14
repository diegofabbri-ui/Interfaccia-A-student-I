import fs from 'fs';
const file = 'src/components/StudyDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const startMarker = "{/* Fase 1: Macro Area */}";
const endMarker = "{/* 4. Copilot Giornaliero */}";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) +
    "<StudyPlanMindMap plan={displayPlan} examName={examName} onDeliverableClick={setActiveDeliverable} />\n\n          " +
    content.substring(endIndex);
  fs.writeFileSync(file, newContent, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Markers not found');
}
