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
  "lastUpdated": "2026-01-27",
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

<!-- 
  This section provides a high-level description of the project.
  Include: purpose, main goals, target audience, key value proposition.
-->

**Region Forge** is a professional browser-based tool for defining and managing polygonal exploration regions over Minecraft biome map images. Draw regions directly on the map, manage complex configurations, and export WorldGuard-style region data.

The MVP is complete and deployed to production (Vercel). The application is fully functional and ready for users.

### Key Features

- **Map Loading**: Generate maps from seeds or load from URLs via integrated microservice
- **Region Drawing**: Draw polygonal regions by clicking points on the map with comprehensive editing tools
- **YAML Export**: Generate WorldGuard-compatible region configurations
- **Project Management**: Save and load complete projects with embedded map images
- **Multi-Dimension Support**: Full support for Overworld, Nether, and End dimensions

---

## Tech Stack

<!-- 
  Document the technologies, frameworks, and tools used in the project.
  This helps with understanding dependencies and technical context.
-->

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

<!-- 
  Describe what you're actively working on right now.
  This helps track immediate priorities and current development state.
-->

Currently focused on bug fixes and security improvements. End dimension support completed. The MVP is complete and deployed, with ongoing work to address medium-priority issues and enhance the user experience. Dimension unification (removing redundant worldType setting) has been completed.

---

## Features (Done)

<!-- 
  WORK ITEM TYPE: Features
  
  List completed features and major accomplishments.
  Use checkboxes to mark completed items if desired.
  Items in this section will be tagged as "Features" by the parser.
  The parser will identify TODO items (- [ ] and - [x]) throughout the document.
-->

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
- [x] Nether Dimension Support - Nether fully enabled with world size slider, nether-specific name generation, and proper export handling
- [x] Dimension Unification - Removed redundant worldType setting; dimension is now the single source of truth

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

<!-- 
  WORK ITEM TYPE: Features
  
  List features currently being developed.
  Include estimated completion or progress indicators if helpful.
  Items in this section will be tagged as "Features" by the parser.
-->

None - MVP is complete and deployed.

---

## Enhancements

<!-- 
  WORK ITEM TYPE: Enhancements
  
  List improvements and enhancements to existing features.
  These are not new features, but improvements to what already exists.
  Items in this section will be tagged as "Enhancements" by the parser.
-->

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

<!-- 
  WORK ITEM TYPE: Bugs
  
  Document bugs, problems, or issues that need to be addressed.
  Include severity, affected areas, and workarounds if available.
  Items in this section will be tagged as "Bugs" by the parser.
  
  Alternative section headings: "Active Bugs", "Outstanding Issues", "Bugs"
-->

### Active Bugs

None - All known bugs have been resolved.

---

## Outstanding Tasks

<!-- 
  WORK ITEM TYPE: Tasks
  
  Inbox for uncategorized work items that may later become features or enhancements.
  Can be organized by priority, category, or timeline.
  Items in this section will be tagged as "Tasks" by the parser.
  
  Alternative section headings: "Tasks", "Outstanding Tasks", "Todo"
-->

### High Priority

- [ ] Complete File Upload Functionality - Drag & drop file upload for local images, file validation (PNG, JPG format), display upload progress/loading state, handle upload errors gracefully. Note: URL loading and seed generation cover all essential use cases. File upload depends on user accounts feature (see `tasks/user-accounts-spec.md`)

### Medium Priority

- [ ] Complete Security Enhancements - File upload validation, security headers, frontend URL validation, logging utility
- [ ] Enhanced Drawing Tools - Chunk snapping, rectangle/circle tools
- [ ] UI Improvements - Zoom to fit, mini-map, keyboard shortcuts
- [x] End Dimension Support - Add End dimension support (see `tasks/completed/end-dimension-addition-spec.md`)

### Low Priority / Future

- [ ] User Accounts Implementation - Authentication system (email/password, OAuth future), cloud storage for projects, image upload capability, project sharing via links, multi-device synchronization, user profiles and settings
- [ ] Onboarding System - Step-by-step guides, tutorials, tooltips (Post-MVP)
- [ ] Comprehensive Testing Suite - Unit tests, integration tests, cross-browser testing
- [ ] Performance Optimization - Canvas rendering optimization, large map handling
- [ ] Additional Polish - UI refinements, accessibility improvements

---

## Project Status

<!-- 
  Optional section for project health indicators.
  Can include metrics, completion percentages, or status summaries.
-->

**Overall Status**: Active Development  
**Completion**: ~90% (MVP Complete)  
**Last Major Update**: January 2026

### Metrics

- **Open Issues**: 0
- **Active Features**: 0
- **Completed Features**: 20+ (including Nether support and dimension unification)
- **Security Status**: Critical vulnerabilities addressed, some medium-priority items remain

---

## Next Steps

<!-- 
  Outline immediate next actions and priorities.
  Helps track what should be worked on next.
-->

### Immediate (Next 1-2 weeks)

1. Complete file upload validation enhancements
2. Add missing security headers
3. Begin End dimension support implementation

### Short-term (Next 1-3 months)

1. Enhanced drawing tools (chunk snapping, rectangle/circle tools)
2. UI improvements (zoom to fit, mini-map, keyboard shortcuts)
3. Improve frontend URL validation
4. Implement logging utility

### Long-term (3+ months)

1. Complete End dimension support (see `tasks/completed/end-dimension-addition-spec.md`) — ✅ Done
2. User accounts implementation
3. Cloud storage and project sharing
4. Onboarding system
5. Comprehensive testing suite
6. Performance optimization
7. Challenge level rename (currently on hold - see `tasks/challenge-level-rename-spec.md`)

---

## Notes

<!-- 
  Additional notes, decisions, or context that doesn't fit elsewhere.
  Can include architecture decisions, lessons learned, or future considerations.
-->

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
- **Dimension Unification**: `tasks/completed/remove-worldtype-setting-spec.md` - Completed: Removed redundant worldType setting, unified on dimension
- **Nether Completion**: `tasks/completed/nether-completion-spec.md` - Completed: Nether dimension fully enabled
- **End Dimension**: `tasks/completed/end-dimension-addition-spec.md` - End dimension support specification (completed)
- **Challenge Level Rename**: `tasks/challenge-level-rename-spec.md` - On hold pending LevelledMobs generator removal
- **User Accounts Spec**: `tasks/user-accounts-spec.md` - Future user accounts feature
- **Deployment Guide**: `docs/DEPLOYMENT.md` - Deployment instructions
- **Seed Generator**: `docs/SEED_GENERATOR_README.md` - Map generation service docs

---
