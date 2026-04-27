// Strip fields the runtime doesn't use from items.json. Cuts the bundle from
// ~795KB → ~580KB without losing any user-visible info. The trimmed file is
// what the client fetches; the master is still in product/data/.
import { readFileSync, writeFileSync } from 'fs'

const items = JSON.parse(readFileSync('product/data/items.json', 'utf-8'))

// Fields the engine + UI never read from items.json:
//   - lore (catalog UI does not render lore yet)
//   - dropsFrom (we don't show drop sources today)
//   - slug (engine uses id; slug == id everywhere we generated it)
const STRIP = ['lore', 'dropsFrom', 'slug']

let stripped = 0
for (const item of items) {
  for (const field of STRIP) {
    if (field in item) {
      delete item[field]
      stripped++
    }
  }
}

writeFileSync('public/data/items.json', JSON.stringify(items) + '\n')
console.log(`Trimmed ${stripped} field references; wrote public/data/items.json`)
const before = readFileSync('product/data/items.json', 'utf-8').length
const after = readFileSync('public/data/items.json', 'utf-8').length
console.log(`Before: ${(before / 1024).toFixed(0)} KB | After: ${(after / 1024).toFixed(0)} KB`)
