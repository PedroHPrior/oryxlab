import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { InventoryView } from "../../sections/inventory/InventoryView"
import { CharactersPanel } from "../../sections/inventory/components/CharactersPanel"
import { useOryxLab } from "../state"

export function InventoryRoute() {
  const { state, actions } = useOryxLab()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // RealmEye returns characters with equipped items in `realmEyeImport.preview`
  // , keep that around even after the modal is closed so users can see + act on
  // their loadouts.
  const previewChars = state.realmEyeImport.preview?.characters ?? []
  const showCharsPanel = previewChars.length > 0 && state.realmEyeImport.step !== "enter-username"

  return (
    <>
      {showCharsPanel && (
        <div className="mb-6">
          <CharactersPanel
            characters={previewChars}
            items={state.items}
            onCompareCharacter={(classId, equipped) => {
              actions.createBuildFromCharacter(classId, equipped)
              navigate("/app")
            }}
          />
        </div>
      )}
      <InventoryView
        view={state.inventoryOwnedEntries.length === 0 ? "empty" : "populated"}
        search={state.inventorySearch}
        ownedSummary={state.inventoryOwnedSummary}
        ownedEntries={state.inventoryOwnedEntries}
        realmEyeImport={state.realmEyeImport}
        manualSelection={state.manualSelection}
        onSwitchView={actions.setInventoryView}
        onSearchChange={actions.setInventorySearch}
        onBrowseCatalog={() => navigate("/app/catalog")}
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
          e.target.value = ""
        }}
      />
    </>
  )
}
