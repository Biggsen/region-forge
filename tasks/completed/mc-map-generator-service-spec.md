# MC Map Generator Service - Technical Specification

## 🎯 Project Overview

A standalone microservice that generates high-quality Minecraft biome maps from seeds using Puppeteer automation. Takes seed + dimension as input, returns generated map image URLs.

## 📁 Repository Structure

```
mc-map-generator/
├── src/
│   ├── server.js              # Express API server
│   ├── screenshot.js          # Puppeteer map generation
│   ├── storage.js             # Image storage abstraction
│   └── utils.js               # Helper functions
├── generated-maps/            # Local image storage
├── tests/
│   ├── api.test.js           # API endpoint tests
│   └── screenshot.test.js    # Screenshot generation tests
├── docs/
│   ├── API.md                # API documentation
│   └── DEPLOYMENT.md         # Deployment guide
├── package.json
├── railway.json              # Railway deployment config
├── render.yaml               # Render deployment config
├── .env.example              # Environment variables template
├── .gitignore
└── README.md
```

## 🛠 Core Dependencies

```json
{
  "name": "mc-map-generator",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.0",
    "puppeteer": "^22.0.0",
    "sharp": "^0.33.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.0.0"
  },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

## 🔌 API Specification

### Base URL
```
https://mc-map-generator.railway.app
```

### Endpoints

#### 1. Generate Map
```http
POST /api/generate
Content-Type: application/json

{
  "seed": "12345",
  "dimension": "overworld"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "processing",
  "estimatedTime": "30-60 seconds"
}
```

#### 2. Check Status
```http
GET /api/status/{jobId}
```

**Response (Processing):**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "processing",
  "progress": "Taking screenshot..."
}
```

**Response (Ready):**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "ready",
  "imageUrl": "https://mc-map-generator.railway.app/generated-maps/seed-12345-overworld-1703123456789.png",
  "metadata": {
    "seed": "12345",
    "dimension": "overworld",
    "generatedAt": "2023-12-21T10:30:45Z",
    "fileSize": "245KB",
    "dimensions": "1000x1000"
  }
}
```

#### 3. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-21T10:30:45Z",
  "version": "1.0.0"
}
```

## 🖼 Image Generation Process

### Screenshot Workflow
1. Launch Puppeteer browser
2. Navigate to `https://mcseedmap.net/1.21.5-Java/{seed}/{dimension}`
3. Handle cookie banner
4. Toggle sidebar for clean view
5. Wait for map to load
6. Take full-page screenshot (3840x2160)
7. Crop to map area (2000x2000)
8. Resize to final size (1000x1000)
9. Save to storage
10. Return image URL

### Supported Dimensions
- `overworld` (default)
- `nether`
- `end`

### Image Specifications
- **Format**: PNG
- **Size**: 1000x1000 pixels
- **Quality**: High (lossless)
- **File Size**: ~200-500KB typical

## 💾 Storage Strategy

### Phase 1: Local Filesystem
- Save to `./generated-maps/` directory
- Serve via Express static middleware
- Cleanup old files (7+ days)

### Phase 2: AWS S3 (Future)
- Upload to S3 bucket
- Return S3 URLs
- Automatic cleanup via S3 lifecycle

## 🚀 Deployment Configuration

### Railway Configuration
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Environment Variables
```bash
# .env.example
PORT=3000
NODE_ENV=production
MAX_CONCURRENT_JOBS=3
CLEANUP_INTERVAL_HOURS=24
MAX_FILE_AGE_DAYS=7
```

## 🧪 Testing Strategy

### Unit Tests
- API endpoint responses
- Screenshot generation logic
- File storage operations
- Error handling

### Integration Tests
- End-to-end map generation
- File cleanup processes
- Concurrent job handling

### Load Testing
- Multiple simultaneous requests
- Memory usage monitoring
- Browser resource cleanup

## 📊 Monitoring & Logging

### Key Metrics
- Request count per minute
- Average generation time
- Success/failure rates
- Storage usage
- Memory consumption

### Logging
```javascript
// Structured logging format
{
  "timestamp": "2023-12-21T10:30:45Z",
  "level": "info",
  "service": "mc-map-generator",
  "jobId": "seed-12345-overworld-1703123456789",
  "message": "Map generation completed",
  "duration": 45000,
  "fileSize": 245760
}
```

## 🔒 Error Handling

### Common Error Scenarios
- Invalid seed format
- Network timeouts
- Puppeteer crashes
- Storage failures
- Concurrent job limits

### Error Response Format
```json
{
  "success": false,
  "error": "GENERATION_FAILED",
  "message": "Failed to generate map: Network timeout",
  "jobId": "seed-12345-overworld-1703123456789",
  "retryable": true
}
```

## 🎯 Success Criteria

### MVP Requirements
- ✅ Generate maps from any valid seed
- ✅ Support all three dimensions
- ✅ Return high-quality 1000x1000 images
- ✅ Handle 3+ concurrent requests
- ✅ Deploy to Railway successfully
- ✅ 95%+ uptime
- ✅ <60 second generation time

### Performance Targets
- **Response Time**: <2 seconds for status checks
- **Generation Time**: 30-60 seconds per map
- **Concurrent Jobs**: 3 simultaneous generations
- **Uptime**: 99%+ availability
- **Error Rate**: <5% failure rate

## 📚 Documentation Requirements

### README.md
- Quick start guide
- API usage examples
- Local development setup
- Deployment instructions

### API.md
- Complete endpoint documentation
- Request/response examples
- Error codes reference
- Rate limiting info

### DEPLOYMENT.md
- Railway deployment steps
- Environment configuration
- Monitoring setup
- Troubleshooting guide

## 🔄 Development Phases

### Phase 1: Core MVP (Week 1)
- Basic Express server
- Puppeteer screenshot generation
- Local file storage
- Simple API endpoints
- Railway deployment

### Phase 2: Production Ready (Week 2)
- Error handling & logging
- File cleanup processes
- Health checks
- Basic monitoring
- Documentation

### Phase 3: Optimization (Week 3)
- Performance tuning
- Concurrent job handling
- Storage optimization
- Load testing
- Production monitoring

## 🏗 Implementation Details

### Core Files to Create

#### 1. `src/server.js`
```javascript
import express from 'express';
import cors from 'cors';
import { generateMap } from './screenshot.js';
import { saveImage, getImageUrl } from './storage.js';

const app = express();
app.use(cors());
app.use(express.json());

// Job tracking
const jobs = new Map();

// API endpoints
app.post('/api/generate', async (req, res) => {
  // Implementation here
});

app.get('/api/status/:jobId', (req, res) => {
  // Implementation here
});

app.get('/api/health', (req, res) => {
  // Implementation here
});

// Serve generated images
app.use('/generated-maps', express.static('./generated-maps'));

export default app;
```

#### 2. `src/screenshot.js`
```javascript
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function generateMap(seed, dimension, jobId) {
  // Based on your existing screenshot-mcseedmap.js
  // Simplified and adapted for the service
}
```

#### 3. `src/storage.js`
```javascript
import fs from 'fs/promises';
import path from 'path';

export async function saveImage(buffer, filename) {
  // Save image to generated-maps directory
}

export function getImageUrl(filename) {
  // Return public URL for the image
}

export async function cleanupOldFiles() {
  // Remove files older than MAX_FILE_AGE_DAYS
}
```

### Key Implementation Notes

1. **Job Management**: Use in-memory Map to track job status
2. **Async Processing**: Generate maps in background, return job ID immediately
3. **Error Recovery**: Handle Puppeteer crashes gracefully
4. **Resource Cleanup**: Ensure browsers are closed properly
5. **File Management**: Implement automatic cleanup of old images

### Based on Current Code

This spec is derived from your existing:
- `scripts/screenshot-mcseedmap.js` - Core Puppeteer logic
- `scripts/api-server.js` - Express server structure
- `package.json` - Dependencies (puppeteer, sharp, express)

The new service will be a simplified, focused version of your current implementation, designed for standalone deployment and external API consumption.

---

This specification provides everything needed to create a production-ready MC Map Generator service that can be deployed independently and consumed by any frontend application.
