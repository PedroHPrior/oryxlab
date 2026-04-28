import { useEffect } from "react"
import { driver, type DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

const STORAGE_KEY = "oryxlab.v2.tour.completed"

const STEPS: DriveStep[] = [
  {
    popover: {
      title: "👋 Welcome to OryxLab",
      description:
        "30-second tour. I'll show you the four things you can do here, then get out of your way.",
      side: "over",
      align: "center",
    },
  },
  {
    element: '[data-build-id]:first-of-type',
    popover: {
      title: "Each column is a build",
      description:
        "Up to 6 builds compare side-by-side. Stats, DPS, EHP — all computed live by the same engine, so you can trust deltas between columns.",
      side: "right",
      align: "start",
    },
  },
  {
    element:
      '[data-build-id]:first-of-type button.group',
    popover: {
      title: "Click any slot to swap an item",
      description:
        "Weapon, ability, armor, or ring. The DPS curve and stat block re-render the moment you pick.",
      side: "right",
      align: "start",
    },
  },
  {
    element: '[data-tour="add-build"]',
    popover: {
      title: "Add another build to compare",
      description:
        "Cap is 6 columns. Useful for A/B/C testing two weapons against three different ability options.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="share"]',
    popover: {
      title: "Share the comparison",
      description:
        "Copies a deterministic URL containing every build + the scenario. Drop it in Discord and your friend sees the exact same numbers you do.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="nav-catalog"]',
    popover: {
      title: "Catalog — 1,500 items",
      description:
        "Browse the full catalog, filter by class / type / tier / rarity / mechanics, and \"Send to comparator\" on any item to spawn a new build column with that item slotted in.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-optimizer"]',
    popover: {
      title: "Optimizer — beam-search loadouts",
      description:
        "Pick a class, an objective (max DPS, EHP, or balanced), and constraints (min HP, no UTs, …). The optimizer finds the best legal loadout in a Web Worker so the UI stays responsive.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav-inventory"]',
    popover: {
      title: "Inventory — RealmEye import",
      description:
        "Paste your RealmEye username and OryxLab pulls your characters' current loadouts. Compare your real builds against optimizer suggestions in one click.",
      side: "bottom",
      align: "start",
    },
  },
  {
    popover: {
      title: "That's it — happy theorycrafting 🛡️",
      description:
        "Replay this tour any time from the <b>Take the tour</b> link in the footer. If you spot a wrong number or item, please open an issue on GitHub — that signal goes straight into the next data update.",
      side: "over",
      align: "center",
    },
  },
]

/**
 * First-visit walkthrough that spotlights the comparator, the four nav tabs,
 * and the share button. Persists completion in localStorage so returning
 * users land on a clean comparator. Triggered manually via the
 * `oryxlab:start-tour` window event (fired by the footer link).
 */
export function OnboardingTour() {
  useEffect(() => {
    const startTour = () => {
      const inst = driver({
        showProgress: true,
        progressText: "{{current}} / {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done",
        allowClose: true,
        animate: true,
        smoothScroll: true,
        steps: STEPS,
        onDestroyed: () => {
          try {
            window.localStorage.setItem(STORAGE_KEY, "1")
          } catch {
            /* ignore */
          }
        },
      })
      inst.drive()
    }

    const onReplayRequest = () => startTour()
    window.addEventListener("oryxlab:start-tour", onReplayRequest)

    let completed = true
    try {
      completed = window.localStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      completed = true
    }

    let timer: number | undefined
    if (!completed) {
      // Defer first-paint so the build columns + nav are mounted and have
      // their final layout before driver.js measures spotlight rectangles.
      timer = window.setTimeout(startTour, 700)
    }

    return () => {
      window.removeEventListener("oryxlab:start-tour", onReplayRequest)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [])

  return null
}
