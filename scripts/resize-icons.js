// Run: node scripts/resize-icons.js
// Requires: npm install sharp --save-dev

const sharp = require('sharp')
const path = require('path')

const icons = ['order', 'preorder', 'staff']

async function resize() {
  for (const name of icons) {
    const src = path.join(__dirname, `../public/icon-${name}-512.png`)
    const dest = path.join(__dirname, `../public/icon-${name}-192.png`)
    await sharp(src).resize(192, 192).toFile(dest)
    console.log(`created icon-${name}-192.png`)
  }
}

resize().catch(console.error)
