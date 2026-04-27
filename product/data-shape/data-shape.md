# Data Shape

## Entities

### Class
A playable Realm of the Mad God class (e.g., Wizard, Knight, Bard). Defines base stats, stat caps, weapon and ability compatibility, and which exaltations apply.

### Item
Any equippable game object — a weapon, ability, armor piece, ring, or talisman. Carries tier, rarity (Tiered / UT / ST), stat bonuses, and special mechanics (piercing, AoE, on-proc effects, directional shot patterns) used by the DPS engine.

### ItemSet
A Set Tiered (ST) collection of four items (weapon + ability + armor + ring) with a named set bonus that activates when the full set is equipped. Includes seasonal sets.

### Exaltation
A per-class permanent stat bonus earned through exaltation quests, available at five levels (0–5) per stat.

### Build
A user-configured loadout: a chosen Class, equipped Items in each compatible slot, exaltation levels, and an optional Scenario override. The unit of comparison, sharing, and optimization across the app.

### Scenario
The combat context used for DPS and EHP calculation: target defense value, active target status effects (Armor Break, Bleeding, Exposed, Cursed), and active party buffs on the caster (Paladin Seal, Warrior Helm, Mystic Curse, Bard buffs). Exists as a global default with optional per-Build overrides.

### Inventory
The user's record of which Items they own — a binary "owned / not owned" set populated manually or via RealmEye import, used by the optimizer's "with my inventory" mode and the optional "owned only" filter.

### SavedBuild
A persisted Build with user-supplied metadata — name, tags, free-text notes, and last-modified date — stored in the browser's localStorage and listed in the Saved Builds drawer.

## Relationships

- Build belongs to one Class
- Build has many Items (one per equipped slot: weapon, ability, armor, ring, talisman)
- Build has many Exaltations (one per applicable stat, levels 0–5)
- Build has one Scenario (or inherits the global Scenario)
- Item belongs to one or more Classes (compatibility list)
- ItemSet has many Items (exactly four — one per slot)
- ItemSet belongs to one or more Classes (whichever can equip its items)
- Class has many Exaltations (the stat-bonus tracks)
- Inventory has many Items (the owned set)
- SavedBuild wraps one Build with persistence metadata
