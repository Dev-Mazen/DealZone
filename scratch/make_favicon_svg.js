const fs = require('fs');
const b64 = fs.readFileSync('frontend/public/favicon.png').toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <image href="data:image/png;base64,${b64}" width="192" height="192"/>
</svg>
`;
fs.writeFileSync('frontend/public/favicon.svg', svg);
console.log('Successfully updated frontend/public/favicon.svg');

