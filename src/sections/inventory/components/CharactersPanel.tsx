import { useMemo } from "react"
import type { RealmEyeCharacter } from "../../../../product/sections/inventory/types"
import type { Item } from "../../../../product/sections/comparator/types"
import { ItemSprite } from "../../_shared/ItemSprite"

interface CharactersPanelProps {
  characters: RealmEyeCharacter[]
  /** Catalog items used to resolve the slug → display sprite. */
  items: Item[]
  /** Triggered when the user clicks "Compare with optimizer" , passes class +
   *  equipped item slugs so the parent can build a Comparator column from them. */
  onCompareCharacter: (classId: string, equipped: { slug: string; name: string }[]) => void
}

/**
 * Shows each RealmEye character with their currently equipped loadout and a
 * one-click "Compare in builder" affordance. The point: a player imports their
 * profile, sees their characters with real gear, and can immediately stack
 * each one against optimizer suggestions in the Comparator.
 */
export function CharactersPanel({ characters, items, onCompareCharacter }: CharactersPanelProps) {
  const slugMap = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const nameMap = useMemo(
    () => new Map(items.map((i) => [i.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim(), i])),
    [items],
  )

  if (characters.length === 0) return null

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Your RealmEye characters
        </h2>
        <span className="text-xs text-zinc-500">{characters.length} chars</span>
      </header>
      <p className="mb-4 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Each card shows what you have equipped <em>right now</em>. Click "Compare in builder" to
        drop the loadout into the Comparator , then run the Optimizer for that class to see if any
        upgrade is worth chasing.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {characters.map((c) => {
          const resolved = (c.equippedItems ?? [])
            .map((e) => {
              if (typeof e !== "object" || e === null) return null
              const cleanName = e.name.toLowerCase().replace(/\s*\(sb\)\s*$/, "").trim()
              return slugMap.get(e.slug) ?? nameMap.get(cleanName) ?? null
            })
            .filter((it): it is Item => it !== null)

          const equippedRaw = (c.equippedItems ?? []).filter(
            (e): e is { slug: string; name: string } => typeof e === "object" && e !== null,
          )

          return (
            <article
              key={c.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              <header className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold capitalize text-zinc-900 dark:text-zinc-100">
                  {c.className}
                </h3>
                <span className="text-[11px] text-zinc-500">
                  {resolved.length} of {equippedRaw.length} matched
                </span>
              </header>
              <div className="flex flex-wrap gap-2">
                {resolved.length === 0 ? (
                  <span className="text-xs text-zinc-500">No items matched in catalog</span>
                ) : (
                  resolved.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
                      title={`${it.name} (${it.tier})`}
                    >
                      <ItemSprite
                        spriteId={it.sprite}
                        imageUrl={it.imageUrl}
                        name={it.name}
                        itemType={it.type}
                        weaponType={it.weaponType}
                        abilityType={it.abilityType}
                        rarity={it.rarity}
                        size="sm"
                      />
                      <span className="max-w-[110px] truncate text-[11px] text-zinc-700 dark:text-zinc-300">
                        {it.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => onCompareCharacter(c.classId, equippedRaw)}
                disabled={resolved.length === 0}
                className={`mt-auto rounded-md px-3 py-1.5 text-sm font-medium ${
                  resolved.length === 0
                    ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                    : "bg-amber-400 text-zinc-950 hover:bg-amber-300"
                }`}
              >
                Compare in builder →
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
