<!-- PROJECT-MANIFEST:START -->
```json
{
  "schemaVersion": 1,
  "projectId": "region-forge",
  "name": "Region Forge",
  "repo": "Biggsen/region-forge",
  "visibility": "public",
  "status": "active",
  "domain": "minecraft",
  "type": "webapp",
  "lastUpdated": "2026-01-12",
  "links": {
    "prod": "https://www.minecraftregionforge.com/",
    "staging": null
  },
  "tags": ["webapp", "typescript", "react", "minecraft", "worldguard"]
}
```
<!-- PROJECT-MANIFEST:END -->

# Region Forge - Project Summary

<!-- 
  The manifest block above contains machine-readable metadata about the project.
  This block MUST be present at the top of the file and MUST be valid JSON.
  The parser extracts this block to populate the Project Atlas dashboard.
  
  Required fields:
  - schemaVersion: Always 1 for v1
  - projectId: Unique identifier (lowercase, hyphens)
  - name: Display name
  - repo: GitHub owner/repo-name
  - visibility: "public" | "staging" | "private"
  - status: "active" | "mvp" | "paused" | "archived"
  - domain: "music" | "minecraft" | "management" | "other" (field/area categorization)
  - type: "webapp" | "microservice" | "tool" | "cli" | "library" | "other" (technical architecture)
  - lastUpdated: ISO date string (YYYY-MM-DD)
  - links: Object with "prod" and "staging" (strings or null)
  - tags: Array of strings
-->

## Project Overview

**Region Forge** is a professional browser-based tool for defining and managing polygonal exploration regions over Minecraft biome map images. Draw regions directly on the map, manage complex configurations, and export WorldGuard-style region data.

The MVP is complete and deployed to production (Vercel). The application is fully functional and ready for users.

### Key Features

- **Map Loading**: Generate maps from seeds or load from URLs via integrated microservice
- **Region Drawing**: Draw polygonal regions by clicking points on the map with comprehensive editing tools
- **YAML Export**: Generate WorldGuard-compatible region configurations
- **Project Management**: Save and load complete projects with embedded map images
- **Multi-Dimension Support**: Work with Overworld, Nether, and End maps

---

## Tech Stack

- **Frontend**: React 18 + TypeScript, Tailwind CSS, Vite
- **Backend**: Express.js (image proxy server)
- **Canvas Rendering**: HTML5 Canvas API
- **State Management**: React Context API with custom hooks
- **Storage**: localStorage for persistence
- **Map Generation**: External microservice (Puppeteer-based) on Railway
- **Deployment**: Vercel (production)
- **Export Formats**: WorldGuard YAML, complete project JSON

---

## Current Focus

Currently focused on bug fixes, security improvements, and dimension unification work. The MVP is complete and deployed, with ongoing work to address medium-priority issues and enhance the user experience. Planning for overworld/nether dimension unification to simplify the codebase.

---

## Features (Done)

### Core Functionality
- [x] Map Loading - Generate maps from seeds or load from URLs via integrated microservice
- [x] Region Drawing - Draw polygonal regions by clicking points on the map
- [x] Coordinate System - Automatic conversion between image pixels and Minecraft world coordinates
- [x] Grid Overlay - Optional chunk grid (16×16 blocks) for precise alignment
- [x] Region Editing - Comprehensive editing tools (move, resize, split, warp, simplify)
- [x] YAML Export - Generate WorldGuard-compatible region configurations
- [x] Project Management - Save and load complete projects with embedded map images
- [x] Region Search - Quick search and filter regions by name
- [x] Village Management - Import villages from CSV and assign to regions
- [x] Plugin Generators - Generate configurations for Achievements, Events, and LevelledMobs
- [x] Custom Markers - Place and manage custom markers on the map
- [x] Multi-Dimension Support - Work with Overworld, Nether, and End maps
- [x] Region Statistics - Calculate region areas and display center points

### UI/UX
- [x] Tab-Based Interface - Organized Map → Regions → Export workflow
- [x] Dark Theme - Modern, professional interface
- [x] Real-Time Updates - Live preview of region YAML as you edit
- [x] Auto-Save - Automatic persistence of regions and map state
- [x] Responsive Design - Works across different screen sizes
- [x] Image Validation - Square dimension validation, size limits (250x250 to 2000x2000)
- [x] Loading States - Async map generation with progress indicators
- [x] Error Handling - Clear error messages and user feedback
- [x] Basic Zoom Controls - Mouse wheel zoom, space+drag pan
- [x] Zoom to Region - Zoom to selected region bounds
- [x] Region Search/Filter - Search functionality in sidebar
- [x] Bulk Delete - Delete all regions implemented

### Security
- [x] SSRF Protection - Image proxy validates URLs, blocks private IPs, DNS resolution
- [x] CORS Restrictions - Environment-based origin whitelist
- [x] Content Security Policy - CSP headers configured in Vercel
- [x] Rate Limiting - Implemented on image proxy endpoints
- [x] Error Sanitization - Production-safe error messages

### Bug Fixes
- [x] Region Creation Without Map - "Create New Region" button disabled when no map is loaded, with clear messaging
- [x] Image Validation - Added square dimension validation and size limits (250x250 to 2000x2000 pixels) for all image loading paths

---

## Features (In Progress)

None - MVP is complete and deployed.

---

## Enhancements

### High Priority Enhancements

- [ ] File Upload Validation - Missing file size limits (10MB), MIME type validation for JSON imports, JSON parsing limits/timeouts
- [ ] Security Headers - Missing site-wide headers: X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- [ ] Frontend URL Validation - Should use `URL` constructor with proper hostname validation instead of simple string checks

### Medium Priority Enhancements

- [ ] Enhanced Drawing Tools - Chunk snapping for precise region boundaries, rectangle drawing tool, circle drawing tool
- [ ] UI Improvements - Zoom to fit (automatically fit map to canvas on load), mini-map for navigation, keyboard shortcuts
- [ ] Comprehensive Error Handling - Improve error handling across all operations
- [ ] Logging Utility - Implement environment-based logging utility (currently uses console.log throughout codebase)

### Low Priority Enhancements

- [ ] Drawing Tool Improvements - Undo/redo functionality, delete individual points while drawing
- [ ] Bulk Region Operations - Duplicate, merge regions
- [ ] Advanced Features - Region templates/presets, region categories/tags, region descriptions/notes, region validation (check for overlapping regions), region perimeter calculation
- [ ] Performance Optimization - Optimize canvas rendering for large maps
- [ ] User Experience - Keyboard navigation support, screen reader compatibility, high contrast mode, colorblind-friendly UI, mobile responsiveness improvements
- [ ] Testing - Add unit tests, add integration tests

---

## Known Issues

### Active Bugs

- [ ] World Size Slider for Nether and End Dimensions - The Nether and End dimensions should have world size slider controls, similar to the Overworld dimension. Currently, world size slider may only be available for Overworld dimension. Nether and End dimensions should also allow users to adjust world size independently. (Medium Priority)

### Bug Details

#### World Size Slider for Nether and End Dimensions
- **Description**: Nether and End dimensions should have world size slider controls, similar to the Overworld dimension. Currently, world size slider is only available for Overworld dimension in `MapLoaderControls.tsx`. Nether and End dimensions should also allow users to adjust world size independently.
- **Severity**: Medium
- **Affected Areas**: 
  - `src/components/MapLoaderControls.tsx` - World size slider only shown for overworld (line 445)
  - `src/components/WorldSizeHeading.tsx` - May need dimension awareness when Nether/End are enabled
  - `src/hooks/useWorldType.ts` - Currently only supports 'overworld' and 'nether' (needs 'end' support)
  - `src/components/SeedInfoHeading.tsx` - Nether and End options are disabled
- **Expected Behavior**: World size slider should be available and functional for all dimensions (Overworld, Nether, End). Each dimension should maintain its own world size setting if applicable. Implementation blocked until Nether and End dimensions are enabled in the UI.

---

## Outstanding Tasks

### High Priority

- [ ] Complete File Upload Functionality - Drag & drop file upload for local images, file validation (PNG, JPG format), display upload progress/loading state, handle upload errors gracefully. Note: URL loading and seed generation cover all essential use cases. File upload depends on user accounts feature (see `spec/user-accounts-spec.md`)

### Medium Priority

- [ ] Complete Security Enhancements - File upload validation, security headers, frontend URL validation, logging utility
- [ ] Enhanced Drawing Tools - Chunk snapping, rectangle/circle tools
- [ ] UI Improvements - Zoom to fit, mini-map, keyboard shortcuts

### Low Priority / Future

- [ ] User Accounts Implementation - Authentication system (email/password, OAuth future), cloud storage for projects, image upload capability, project sharing via links, multi-device synchronization, user profiles and settings
- [ ] Onboarding System - Step-by-step guides, tutorials, tooltips (Post-MVP)
- [ ] Comprehensive Testing Suite - Unit tests, integration tests, cross-browser testing
- [ ] Performance Optimization - Canvas rendering optimization, large map handling
- [ ] Additional Polish - UI refinements, accessibility improvements

---

## Project Status

**Overall Status**: Active Development  
**Completion**: ~90% (MVP Complete)  
**Last Major Update**: January 2026

### Metrics

- **Open Issues**: 1 (Medium Priority)
- **Active Features**: 0
- **Completed Features**: 18+
- **Security Status**: Critical vulnerabilities addressed, some medium-priority items remain

---

## Next Steps

### Immediate (Next 1-2 weeks)

1. Fix World Size Slider bug for Nether and End dimensions
2. Complete file upload validation enhancements
3. Add missing security headers

### Short-term (Next 1-3 months)

1. Enhanced drawing tools (chunk snapping, rectangle/circle tools)
2. UI improvements (zoom to fit, mini-map, keyboard shortcuts)
3. Improve frontend URL validation
4. Implement logging utility

### Long-term (3+ months)

1. Overworld/Nether dimension unification (see `tasks/overworld-nether-unification-spec.md`)
2. End dimension support addition (after unification)
3. User accounts implementation
4. Cloud storage and project sharing
5. Onboarding system
6. Comprehensive testing suite
7. Performance optimization

---

## Notes

- **MVP Status**: ✅ Complete and deployed
- **Production Ready**: Yes, fully functional
- **User Feedback**: Ready to collect user feedback for prioritization
- **Technical Debt**: Minimal - well-organized codebase
- **Security**: Critical vulnerabilities addressed, some medium-priority items remain
- **Architecture Decision**: Client-side React application with localStorage persistence. External microservice for map generation. Image proxy server for CORS-free image loading.
- **Future Consideration**: User accounts feature will enable cloud storage, image upload, and project sharing capabilities

---

## Related Documentation

- **Main README**: `README.md` - User-facing documentation
- **Bug List**: `tasks/buglist.md` - Current bugs and resolved issues
- **MVP Plan**: `tasks/completed/MVP_DEV_PLAN.md` - Development roadmap and status
- **Security Spec**: `tasks/enhancements/security_enhancement_spec.md` - Security vulnerabilities and fixes
- **Dimension Unification**: `tasks/overworld-nether-unification-spec.md` - Overworld/Nether unification specification
- **User Accounts Spec**: `tasks/user-accounts-spec.md` - Future user accounts feature
- **Deployment Guide**: `docs/DEPLOYMENT.md` - Deployment instructions
- **Seed Generator**: `docs/SEED_GENERATOR_README.md` - Map generation service docs

---
