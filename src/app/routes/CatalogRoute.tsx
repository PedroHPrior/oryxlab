import { useMemo, useState } from "react"
import { CatalogView } from "../../sections/catalog/CatalogView"
import { ItemDetailModal } from "../../sections/catalog/components/ItemDetailModal"
import { QuickComparePanel } from "../../sections/catalog/components/QuickComparePanel"
import catalogData from "../../../product/sections/catalog/data.json"
import type { CatalogItem, ItemSet, DropSource } from "../../../product/sections/catalog/types"
import { useOryxLab } from "../state"

export function CatalogRoute() {
  const { state, actions } = useOryxLab()
  const [detailItemId, setDetailItemId] = useState<string | null>(null)

  const catalogItems = useMemo<CatalogItem[]>(() => {
    if (state.items.length === 0) return catalogData.items as unknown as CatalogItem[]
    return state.items.map((it) => ({
      ...it,
      tierNumeric: typeof (it as unknown as { tierNumeric?: number }).tierNumeric === "number"
        ? (it as unknown as { tierNumeric?: number }).tierNumeric!
        : 99,
      dropsFrom: [],
      lore: "",
      owned: state.inventoryOwnedEntries.some((e) => e.itemId === it.id),
    })) as CatalogItem[]
  }, [state.items, state.inventoryOwnedEntries])

  const detailItem = useMemo(
    () => catalogItems.find((it) => it.id === detailItemId) ?? null,
    [catalogItems, detailItemId],
  )

  const compareItems = useMemo(
    () =>
      state.catalogQuickCompare.selectedIds
        .map((id) => catalogItems.find((it) => it.id === id))
        .filter(Boolean) as CatalogItem[],
    [catalogItems, state.catalogQuickCompare.selectedIds],
  )

  return (
    <>
      <CatalogView
        viewMode={state.catalogViewMode}
        ownedOnly={state.catalogOwnedOnly}
        search={state.catalogSearch}
        sort={state.catalogSort}
        filters={state.catalogFilters}
        items={catalogItems}
        itemSets={catalogData.itemSets as ItemSet[]}
        dropSources={catalogData.dropSources as DropSource[]}
        tagPalette={catalogData.tagPalette as string[]}
        quickCompare={state.catalogQuickCompare}
        onViewModeChange={actions.setCatalogViewMode}
        onToggleOwnedOnly={actions.toggleCatalogOwnedOnly}
        onSearchChange={actions.setCatalogSearch}
        onSortChange={actions.setCatalogSort}
        onFiltersChange={actions.setCatalogFilters}
        onClearFilters={actions.clearCatalogFilters}
        onToggleQuickCompareItem={actions.toggleQuickCompareItem}
        onOpenQuickCompare={actions.openQuickCompare}
        onCloseQuickCompare={actions.closeQuickCompare}
        onOpenItemDetail={(id) => setDetailItemId(id)}
        onAddItemToComparator={(id) => actions.addBuildWithItem(id)}
      />
      <ItemDetailModal
        item={detailItem}
        isOwned={
          detailItem
            ? state.inventoryOwnedEntries.some((e) => e.itemId === detailItem.id)
            : false
        }
        onClose={() => setDetailItemId(null)}
        onSendToComparator={(id) => {
          actions.addBuildWithItem(id)
          setDetailItemId(null)
        }}
        onMarkOwned={(id) => actions.addInventoryEntry(id)}
      />
      {state.catalogQuickCompare.open && compareItems.length > 0 && (
        <QuickComparePanel
          items={compareItems}
          classes={state.classesData}
          scenario={state.globalScenario}
          onClose={actions.closeQuickCompare}
          onRemove={(id) => actions.toggleQuickCompareItem(id)}
          onSendToComparator={(id) => {
            actions.addBuildWithItem(id)
            actions.closeQuickCompare()
          }}
        />
      )}
    </>
  )
}
