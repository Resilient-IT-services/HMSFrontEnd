/* eslint-disable @typescript-eslint/no-require-imports, unicorn/prefer-module, sonarjs/slow-regex */
const fs = require('node:fs');
const path = require('node:path');

const files = [
  'src/modules/admin/pages/HospitalLabSettingsPage.tsx',
  'src/modules/lab/pages/LabInventoryPage.tsx',
  'src/modules/lab/pages/LabMachinesPage.tsx',
  'src/modules/lab/pages/LabPackagesPage.tsx',
  'src/modules/lab/pages/LabQueuePage.tsx',
  'src/modules/lab/pages/LabReportsPage.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to match useEffect calling fetch...()
    content = content.replaceAll(
      /useEffect\(\(\) => \{\s+(fetch[a-zA-Z0-9_]+)\(\);\s+\}, \[\1\]\);/g,
      `useEffect(() => {
        const init = async () => {
            await $1();
        };
        init();
    }, [$1]);`
    );
    
    // Pattern for LabQueuePage
    content = content.replaceAll(
      /useEffect\(\(\) => \{\s+fetchQueue\(\);\s+\/\/\s+eslint-disable-next-line.*?\s+\}, \[activeTab\]\);/g,
      `useEffect(() => {
        const init = async () => {
            await fetchQueue();
        };
        init();
    }, [activeTab, fetchQueue]);`
    );

    // Number conversions
    content = content.replaceAll('isNaN(', 'Number.isNaN(');
    content = content.replaceAll('parseFloat(', 'Number.parseFloat(');
    content = content.replaceAll('parseInt(', 'Number.parseInt(');

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
  } else {
    console.log('Not found', file);
  }
});
