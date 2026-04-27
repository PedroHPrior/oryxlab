import { useRef } from "react"
import { InventoryView } from "../../sections/inventory/InventoryView"
import { useOryxLab } from "../state"

export function InventoryRoute() {
  const { state, actions } = useOryxLab()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  return (
    <>
      <InventoryView
        view={state.inventoryView}
        search={state.inventorySearch}
        ownedSummary={state.inventoryOwnedSummary}
        ownedEntries={state.inventoryOwnedEntries}
        realmEyeImport={state.realmEyeImport}
        manualSelection={state.manualSelection}
        onSwitchView={actions.setInventoryView}
        onSearchChange={actions.setInventorySearch}
        onOpenManualSelect={actions.openManualSelect}
        onOpenRealmEyeImport={actions.openRealmEyeImport}
        onChangeRealmEyeInput={actions.changeRealmEyeInput}
        onFetchRealmEyePreview={actions.fetchRealmEyePreview}
        onConfirmRealmEyeOverwrite={actions.confirmRealmEyeOverwrite}
        onConfirmRealmEyeMerge={actions.confirmRealmEyeMerge}
        onCloseRealmEyeImport={actions.closeRealmEyeImport}
        onRemoveEntry={actions.removeInventoryEntry}
        onClearAll={actions.clearInventory}
        onExport={actions.exportInventoryJson}
        onImport={() => fileInputRef.current?.click()}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) await actions.importInventoryJson(file)
          // Allow re-uploading the same file later by resetting the input
          e.target.value = ""
        }}
      />
    </>
  )
}
