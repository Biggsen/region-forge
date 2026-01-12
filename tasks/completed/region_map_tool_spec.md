# 🗺️ Region Map Tool — Technical Specification

## 🔧 Overview
A browser-based utility for defining and managing **polygonal exploration regions** over a locally provided Minecraft biome map image. Users draw regions directly on the map, name them, and inspect the generated **WorldGuard-style region data** in the UI. No file saving/exporting is required — data is shown for copy-paste.

---

## 🧱 Tech Stack

| Layer              | Technology                         | Notes |
|--------------------|-------------------------------------|-------|
| **Frontend**       | React + TypeScript                 | SPA using functional components |
| **Rendering**      | HTML5 Canvas (`<canvas>`)          | Renders image, overlays, and interaction |
| **State Management** | Zustand or React Context           | Tracks image, regions, selection, zoom, etc. |
| **Styling**        | Tailwind CSS                       | Utility-first styling |
| **Coordinate Math**| Custom utility functions           | For image → world coordinate conversion |
| **Clipboard**      | DOM clipboard API                  | For copying region YAML |

---

## 🎯 Core Features

### 1. 📌 Map Input
- User uploads a local biome map image (PNG/JPG)
- Image is rendered on canvas
- Center of image = Minecraft world origin `(x = 0, z = 0)`

### 2. 🧭 Coordinate Mapping
- Each pixel = 1 block
- Image coordinate to world coordinate conversion:
  ```ts
  world_x = pixel_x - Math.floor(image_width / 2)
  world_z = pixel_y - Math.floor(image_height / 2)
  ```
- Top of image = negative Z  
- Left of image = negative X

---

## 🎨 UI Components

| Component               | Description |
|-------------------------|-------------|
| **Canvas Map Renderer** | Renders uploaded image + regions |
| **Zoom & Pan Controls** | Mouse wheel, buttons, or drag |
| **Grid Overlay Toggle** | Toggles chunk/block grid |
| **Region Drawing Mode** | Click to place polygon points |
| **Region Editor**       | Select + drag region vertices |
| **Region List Panel**   | View, rename, select regions |
| **Region YAML Panel**   | Displays WorldGuard region data (read-only, copyable) |

---

## 🧾 Region Data Model

```ts
type Region = {
  id: string
  name: string
  points: { x: number; z: number }[]
  centerPoint?: { x: number; z: number } | null
  subregions?: Subregion[]
  challengeLevel?: ChallengeLevel
  hasSpawn?: boolean
}
```

---

## 📋 Region Data Output

Shown in the UI when a region is selected (not exported):

```yaml
my_region:
  type: poly2d
  min-y: 0
  max-y: 255
  points:
    - {x: -4600, z: 1536}
    - {x: -4580, z: 1572}
    ...
```

- Name is editable
- Output updates live with edits
- "Copy" button copies YAML to clipboard

---

## 📐 Grid Overlay

- Optional grid layer aligned to:
  - Chunk grid (16×16 blocks)
  - Region grid (e.g. 512×512 blocks)
- Centered at (0, 0)
- Gridlines drawn over canvas

---

## 📋 User Actions

| Action                | Behavior |
|-----------------------|----------|
| Click on map          | Adds a point to current polygon |
| Double-click or Finish | Completes the region |
| Click region          | Selects it for editing |
| Drag vertex           | Moves polygon point |
| Rename region         | Updates ID and YAML |
| Copy YAML             | Copies data to clipboard |
| Zoom in/out           | Adjusts canvas scale |
| Pan view              | Click+drag or scrollbars |

---

## 🚫 Out of Scope

- No seed-based generation or biome logic
- No server or mod integration
- No file saving or loading
- No export to `.yml` or `.json`

---

## 🧰 Project Structure (Suggested)

```
/src
  /components
    MapCanvas.tsx
    RegionOverlay.tsx
    RegionEditor.tsx
    GridOverlay.tsx
    RegionPanel.tsx
  /hooks
    useRegions.ts
    useCoordinates.ts
  /utils
    coordinateUtils.ts
    polygonUtils.ts
  App.tsx
  index.tsx
```

---

## 🗂 Optional Future Features

- Export all regions to file (`regions.yml`)
- Import saved region data
- Support for chunk snapping
- Tool presets: "Draw", "Select", "Edit"