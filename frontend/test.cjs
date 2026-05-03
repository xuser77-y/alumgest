const fs = require('fs');
const https = require('https');

https.get('https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf', (res) => {
  let data = [];
  res.on('data', (chunk) => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    const base64 = buffer.toString('base64');
    fs.writeFileSync('./src/utils/amiriFont.js', `export const amiriFont = "${base64}";`);
    console.log("Font downloaded, length:", base64.length);
  });
}).on('error', (e) => console.error(e));
