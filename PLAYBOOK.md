# Project Terminus — Playbook

## Overview

A 3D space colony simulator and operations dashboard. Currently features the Artemis moonbase view — a real-time lunar base status dashboard with a 3D interactive map, simulated telemetry panels, and a Ridley Scott / Prometheus aesthetic. Future views planned for Mars, Titan, and other destinations.

## Stack

- **React 19** + **TypeScript** + **Vite 7**
- **react-three-fiber** (R3F) + **@react-three/drei** — declarative 3D scene
- **@react-three/postprocessing** — bloom, vignette
- **Zustand** — state management (simulation store)
- **Tailwind CSS v4** — styling with custom design tokens
- **three.js** — 3D engine

## Architecture

### Layout

Three-column grid: left telemetry panels | center 3D map | right telemetry panels, with a top bar and bottom alert feed.

### Data Model (`src/data/base-config.ts`)

The base is defined as a **junction + module node graph**:

- **Junctions** — small hub nodes at grid intersections (T or + shaped), with directional ports (north/south/east/west)
- **Modules** — cylindrical segments that span between two junctions (or extend as dead-ends from one junction)
- **Hallways** — thin corridor tubes rendered between module end caps and junction ports

Junction grid is currently 3x2 (6 junctions, 4-unit spacing). 13 modules: 7 spanning, 6 dead-end.

### 3D Scene (`src/components/base-map/`)

| File | Purpose |
|------|---------|
| `BaseMap.tsx` | Canvas, camera, lighting, fog, orbit controls, WASD+QE keyboard controller, click-to-focus |
| `Module3D.tsx` | Per-module geometry (unique visuals per module type), hover/click interaction, status glow |
| `Junction3D.tsx` | Hub spheres with directional port stubs |
| `Hallway3D.tsx` | Thin corridor tubes connecting modules to junctions |
| `SolarFarm3D.tsx` | External solar panel array east of the Power Station |

### Simulation (`src/lib/simulation.ts`, `src/store/simulation.ts`)

Tick-based simulation (2s interval, 30x time acceleration). Gaussian drift on all telemetry values toward nominal targets. Random events (EVA, equipment, alerts). Threshold-based status escalation (nominal → warning → critical). Module temperatures drift toward per-module baselines.

### Telemetry Panels (`src/components/panels/`)

Six panels across two sidebars: Atmosphere, Water, Radiation (left); Power, Comms, Crew (right). Plus a Controls panel showing WASD/QE/mouse bindings.

Shared `StatusPanel` base component with status-dependent styling (glow, pulse, color).

### Styling

Dark sci-fi theme defined in `src/index.css`. Key tokens: `--color-cyan` (#00d4e0), panel backgrounds with subtle gradients, corner brackets, scanline sweep effects, grid overlays. Font: monospace throughout.

### Current Base Layout

```
              [COM]              [OBS]
                |                  |
  [MED]═══(J1)═══[CMD]═══(J2)═══[LAB]═══(J3)═══[FAB]
                |                  |                |
              [LSS]              [GRN]            [STR]
                |                 ⌒⌒                |
         ═══(J4)═══[HAB]═══(J5)═══[REC]═══(J6)═══[PWR]──[Solar Farm]
                                   |
                                 [ALK]
```

GRN = geodesic greenhouse dome (triangular glass panels, grow lights, visible plants).
Solar farm = 4x3 panel array with power conduit to PWR module.

### Key Design Decisions

- **4:1 module-to-hallway diameter ratio** — modules are visually dominant, hallways are thin connectors
- **Junction-based layout** replaced earlier radial layout — eliminates corridor gap issues, allows clean end-cap connections
- **Greenhouse is a standalone dome** — no cylinder, hallways connect directly to dome wall ports
- **Airlock on perimeter** — dead-end south of J5 for logical surface access
- **Click-to-focus** — clicking a module smoothly pans the camera to center on it
- **6DOF keyboard controls** — WASD for horizontal movement, QE for altitude

---

## Roadmap

### Short Term

- [ ] **Scale up the base** — greatly expand the current layout to represent a larger, more ambitious lunar installation (more junctions, more modules, wider footprint)
- [ ] **Nuclear power module** — add a fission reactor module with appropriate geometry (cooling towers/radiator fins, containment vessel), positioned away from habitation
- [ ] **ISRU plant** — in-situ resource utilization module for processing regolith into oxygen, water, and building materials
- [ ] **Expand the solar farm** — larger array, multiple fields, possibly at different orientations
- [ ] **More greenhouse domes** — additional agricultural modules, possibly varying sizes and crop types
- [ ] **Rovers** — small vehicle models parked near the airlock or on patrol routes, possibly with simple animated movement
- [ ] **Launch pads** — landing pads with rocket/lander models (legs deployed, maybe engine glow), connected to base via roads
- [ ] **Roads** — surface paths/tracks between base facilities, launch pads, and outlying installations
- [ ] **Detail HUD / slideout panel** — clicking a module opens a detailed view with full telemetry, schematics, crew assignments, maintenance logs
- [ ] **Improved movement controls** — smoother camera, possible flythrough mode, minimap, bookmarked viewpoints
- [ ] **Improved lunar terrain** — heightmap displacement, crater geometry, rocks, more realistic regolith texture, horizon
- [ ] **Larger map with infinite feel** — extend ground plane, LOD system, procedural terrain at distance, atmospheric haze for depth

### Medium Term

- [ ] **Satellite installations** — smaller remote outposts (mining sites, relay stations, observatories) located away from the main base, with a view-switching UI to navigate between locations
- [ ] **Mars base** — a separate page (`/mars`) with its own theme (rusty reds, dust storms, different atmosphere sim), similar UX and architecture but distinct visual identity and module set (MOXIE, radiation-hardened habs, dust-sealed airlocks)
