const fs = require('fs');
const data = JSON.parse(fs.readFileSync('E:\\\\git\\\\tidbet\\\\goo-nee.netlify.app-20260220T115456.json', 'utf8'));

console.log('--- All Audits ---');
if (data && data.audits) {
  Object.keys(data.audits).forEach(key => {
    const audit = data.audits[key];
    console.log(`${key}: score=${audit.score}, value=${audit.displayValue || ''}`);
  });
} else {
  console.log('No audits found');
}
