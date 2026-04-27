// Vercel serverless function: proxy RealmEye player profile to bypass CORS.
// POST /api/inventory-import { username }
// Returns: { username, preview: { vaultCount, characterCount, characters, delta }, items }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const { username } = req.body ?? {}
  if (!username || typeof username !== 'string') {
    res.status(400).json({ error: 'username required' })
    return
  }
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, '')
  try {
    const url = `https://www.realmeye.com/player/${encodeURIComponent(safe)}`
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OryxLab/1.0)' },
    })
    if (!r.ok) {
      res.status(404).json({ error: 'profile not found', status: r.status })
      return
    }
    const html = await r.text()

    // Parse vault items
    const items = []
    const equipRe = /<a href="\/wiki\/([^"]+)"><img alt="([^"]+)"[^>]+src="(\/s\/a\/img\/wiki\/i\/[^"]+)"[^>]*class="img-responsive"/g
    let m
    while ((m = equipRe.exec(html)) !== null) {
      items.push({ slug: m[1], name: m[2], imageUrl: `https://www.realmeye.com${m[3]}` })
    }

    // Parse characters
    const charsRe = /<tr[^>]*data-character-id="(\d+)"[\s\S]*?<\/tr>/g
    const characters = []
    let cm
    let charIdx = 0
    while ((cm = charsRe.exec(html)) !== null) {
      const row = cm[0]
      const classMatch = row.match(/<a href="\/player\/[^"]+\/[^"]+">([^<]+)<\/a>/)
      const className = classMatch ? classMatch[1] : 'Unknown'
      const equipped = []
      const eqRe = /<a href="\/wiki\/([^"]+)"><img alt="([^"]+)"/g
      let em
      while ((em = eqRe.exec(row)) !== null) {
        equipped.push(em[1])
      }
      characters.push({
        id: `char-${charIdx++}`,
        classId: className.toLowerCase(),
        className,
        equippedItems: equipped,
      })
    }

    res.status(200).json({
      username: safe,
      preview: {
        username: safe,
        vaultCount: items.length,
        characterCount: characters.length,
        characters,
        delta: { added: items.length, removed: 0, unchanged: 0 },
      },
      items,
    })
  } catch (e) {
    res.status(500).json({ error: String(e?.message ?? e) })
  }
}
