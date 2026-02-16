# 🗺️ MC Region Maker

A professional browser-based tool for defining and managing polygonal exploration regions over Minecraft biome map images. Draw regions directly on the map, manage complex configurations, and export WorldGuard-style region data.

## Features

### Core Functionality
- 🗺️ **Map Loading**: Generate maps from seeds or load from URLs via integrated microservice (Overworld: terrain + biome layers)
- 🎯 **Region Drawing**: Draw polygonal regions by clicking points on the map
- 🧭 **Coordinate System**: Automatic conversion between image pixels and Minecraft world coordinates
- 📐 **Grid Overlay**: Optional chunk grid (16×16 blocks) for precise alignment
- 🔧 **Region Editing**: Comprehensive editing tools (move, resize, split, warp, simplify)
- 📋 **YAML Export**: Generate WorldGuard-compatible region configurations
- 💾 **Project Management**: Save and load complete projects with embedded map images
- 🔍 **Region Search**: Quick search and filter regions by name

### Advanced Features
- 🏘️ **Village Management**: Import villages from CSV and assign to regions
- 🎮 **Plugin Generators**: Generate configurations for Achievements, Events, and LevelledMobs
- 🎨 **Custom Markers**: Place and manage custom markers on the map
- 🌍 **Multi-Dimension Support**: Work with Overworld, Nether, and End maps
- 📊 **Region Statistics**: Calculate region areas and display center points
- 🎯 **Advanced Tools**: Warp regions, split polygons, simplify vertices, and more

### UI/UX
- 📑 **Tab-Based Interface**: Organized Map → Regions → Export workflow
- 🎨 **Dark Theme**: Modern, professional interface
- 🔄 **Real-Time Updates**: Live preview of region YAML as you edit
- 💾 **Auto-Save**: Automatic persistence of regions and map state
- 📱 **Responsive Design**: Works across different screen sizes

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Map Generator Service running on `localhost:3001` (for seed-based map generation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. (Optional) Start the image proxy server to avoid CORS issues with external images:
```bash
npm run proxy
```

4. Open your browser to `http://localhost:3000`

## Usage

### 1. Load a Map

**Option A: Generate from Seed**
- Navigate to the **Map** tab
- Enter a Minecraft seed (number or text)
- Select dimension (Overworld, Nether, or End)
- Adjust world size if generating Overworld (2k-16k)
- Click "Generate Map Image" and wait for processing (30-60 seconds)
- For Overworld, both terrain and biome maps are imported; Nether/End load terrain only
- Click "Import Map" to load it into the editor

**Option B: Load from URL**
- Navigate to the **Map** tab
- Enter the terrain map URL (required) and optionally the biome map URL
- Both images must have matching dimensions
- Click "Load"

### 2. Set Origin

- Click on the map to set the world origin point (0, 0)
- This establishes the coordinate system for your regions
- The origin is typically set at spawn or the center of your build area

### 3. Create Regions

- Navigate to the **Regions** tab
- Click "Create New Region" and enter a name
- Click "Start Drawing"
- Click on the map to place polygon points
- Double-click or click "Finish Drawing" to complete the region

### 4. Edit Regions

- Select a region from the list or click on it on the map
- Edit properties (name, challenge level, spawn point, etc.)
- Use advanced tools: move, resize, split, warp, simplify vertices
- Adjust center points, manage villages, and set custom properties

### 5. Export Data

- Navigate to the **Export** tab
- Click "Export YAML" to configure export options
- Choose to include villages, heart regions, spawn region, etc.
- Download the WorldGuard-compatible YAML file
- Or copy individual region YAML to clipboard from the Regions tab

### 6. Save/Load Projects

- Click "Save" in the header to export a complete project (includes map, regions, settings)
- Click "Load" to import a previously saved project
- All data is also auto-saved to localStorage

## Coordinate System

- **Pixel to Block Conversion**: Each pixel = 8 Minecraft blocks (for mcseedmap.net maps)
- **Origin Point**: User-defined origin maps to world coordinates (0, 0)
- **Image Alignment**: Top of image = negative Z, Left of image = negative X
- **Y-Axis**: Defaults to 0-255 (configurable per region, supports modern world height)

## Map Generation Service

The application uses an external microservice for generating biome maps from seeds:

- **Service Endpoint**: `http://localhost:3001` (development) or Railway (production)
- **Features**: Async job-based generation, supports all dimensions, configurable world sizes
- **Output**: High-quality 1000x1000 PNG images
- **See**: `docs/SEED_GENERATOR_README.md` for detailed API documentation

## Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Rendering**: HTML5 Canvas for map and region overlays
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **State Management**: React Context API with custom hooks

### Backend Services
- **Map Generator Service**: External microservice (Puppeteer-based) for seed map generation
- **Image Proxy Server**: Express server (port 3002) for CORS-free image loading

### Project Structure
```
src/
├── components/     # React components (MainApp, MapCanvas, RegionPanel, etc.)
├── hooks/         # Custom React hooks (useRegions, useMapState, etc.)
├── utils/         # Utility functions (coordinateUtils, exportUtils, etc.)
├── context/       # React Context providers
└── types.ts       # TypeScript type definitions
```

## Development

```bash
npm run dev              # Start development server (port 3000)
npm run proxy            # Start image proxy server (port 3002)
npm run dev:with-proxy   # Start both frontend and proxy
npm run build            # Build for production
npm run preview          # Preview production build
```

## Documentation

- **Seed Generator**: `docs/SEED_GENERATOR_README.md` - Map generation service usage
- **API Reference**: `reference/mc-map-generator API docs.md` - Service API documentation
- **Tasks**: `spec/TASKS.md` - Current task list and feature status
- **MVP Plan**: `spec/MVP_DEV_PLAN.md` - Development roadmap and status

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Canvas**: HTML5 Canvas API for map rendering
- **Services**: Express.js (image proxy), External microservice (map generation)
- **Storage**: localStorage for persistence

## CORS and Image Embedding

When loading external images (from URLs), the app automatically uses a proxy server to avoid CORS issues. This ensures that images can be properly embedded in exported project files.

- **Without proxy**: External images show a CORS dialog and can't be embedded
- **With proxy**: All images load seamlessly and embed perfectly in exports

The proxy server runs on port 3002 and is automatically used for external URLs.

## Export Formats

### WorldGuard YAML
Standard WorldGuard region format compatible with WorldGuard plugins for Minecraft servers.

### Complete Project Export
JSON format containing:
- All regions with full configuration
- Map image(s): terrain and biome layers (embedded as base64) when both are loaded
- Map state (zoom, position, origin)
- World name and settings
- Spawn coordinates
- World type

## License

Private project - All rights reserved
