const fs = require('fs')
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'))
manifest.icon = 'icon.png'
fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2))
console.log('manifest.json patched with icon')
