# MC Map Generator API Documentation

A standalone microservice that generates high-quality Minecraft biome maps from seeds using Puppeteer automation.

## Base URLs

- **Production:** `https://mc-map-generator-production.up.railway.app`
- **Local Development:** `http://localhost:3001`

## Authentication

No authentication required for MVP.

## Rate Limiting

- **Concurrent Jobs:** Maximum 3 simultaneous map generations
- **429 Response:** When limit exceeded

---

## Endpoints

### 1. Generate Map

Creates a new map generation job and returns immediately with a job ID for polling.

**Endpoint:** `POST /api/generate`

**Request Body:**
```json
{
  "seed": "12345",
  "dimension": "overworld",
  "size": 8,
  "debug": false
}
```

**Parameters:**
- `seed` (required): Minecraft seed (string or number)
- `dimension` (optional): Dimension type - `"overworld"`, `"nether"`, or `"end"` (default: `"overworld"`)
- `size` (optional): World size from 2-16 (representing 2k-16k) (default: `8`)
- `debug` (optional): Save original screenshot (default: `false`)

**Success Response (200):**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "processing",
  "estimatedTime": "30-60 seconds"
}
```

**Error Responses:**

**400 - Invalid Input:**
```json
{
  "success": false,
  "error": "INVALID_SEED",
  "message": "Seed is required and must be a valid string or number"
}
```

**429 - Too Many Jobs:**
```json
{
  "success": false,
  "error": "TOO_MANY_JOBS",
  "message": "Maximum 3 concurrent jobs allowed"
}
```

**500 - Server Error:**
```json
{
  "success": false,
  "error": "SERVER_ERROR",
  "message": "Internal server error"
}
```

---

### 2. Check Job Status

Poll this endpoint to check the status of a map generation job.

**Endpoint:** `GET /api/status/{jobId}`

**Path Parameters:**
- `jobId`: The job ID returned from the generate endpoint

**Processing Response (200):**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "processing",
  "progress": "Taking screenshot..."
}
```

**Ready Response (200) - Nether/End:**
```json
{
  "success": true,
  "jobId": "seed-12345-nether-1703123456789",
  "status": "ready",
  "terrainUrl": "https://mc-map-generator-production.up.railway.app/generated-maps/seed-12345-nether-8k-1703123456789.png",
  "imageUrl": "https://mc-map-generator-production.up.railway.app/generated-maps/seed-12345-nether-8k-1703123456789.png",
  "metadata": {
    "seed": "12345",
    "dimension": "nether",
    "size": "8k",
    "generatedAt": "2023-12-21T10:30:45Z",
    "fileSize": "245KB",
    "dimensions": "1000x1000"
  }
}
```

**Ready Response (200) - Overworld (terrain + biome):**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "ready",
  "terrainUrl": "https://mc-map-generator-production.up.railway.app/generated-maps/seed-12345-overworld-8k-1703123456789.png",
  "biomeUrl": "https://mc-map-generator-production.up.railway.app/generated-maps/seed-12345-overworld-8k-biome-1703123456789.png",
  "imageUrl": "https://mc-map-generator-production.up.railway.app/generated-maps/seed-12345-overworld-8k-1703123456789.png",
  "metadata": {
    "seed": "12345",
    "dimension": "overworld",
    "size": "8k",
    "generatedAt": "2023-12-21T10:30:45Z",
    "fileSize": "245KB",
    "dimensions": "1000x1000"
  }
}
```
Note: `imageUrl` is an alias for `terrainUrl` (backward compatibility).

**Failed Response (200):**
```json
{
  "success": true,
  "jobId": "seed-12345-overworld-1703123456789",
  "status": "failed",
  "error": "GENERATION_FAILED",
  "message": "Failed to generate map: Network timeout",
  "retryable": true
}
```

**404 - Job Not Found:**
```json
{
  "success": false,
  "error": "JOB_NOT_FOUND",
  "message": "Job not found"
}
```

---

### 3. Health Check

Check if the service is running and healthy.

**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2023-12-21T10:30:45Z",
  "version": "1.0.0",
  "activeJobs": 2,
  "maxConcurrentJobs": 3
}
```

---

### 4. Service Statistics

Get current service statistics and job counts.

**Endpoint:** `GET /api/stats`

**Response (200):**
```json
{
  "success": true,
  "totalJobs": 15,
  "completedJobs": 12,
  "failedJobs": 1,
  "processingJobs": 2,
  "activeJobs": 2,
  "maxConcurrentJobs": 3
}
```

---

### 5. Cleanup Old Jobs

Manually trigger cleanup of old completed jobs (optional maintenance).

**Endpoint:** `POST /api/cleanup`

**Response (200):**
```json
{
  "success": true,
  "message": "Cleanup completed",
  "cleanedCount": 5,
  "remainingJobs": 10
}
```

---

## Image Generation Process

### Workflow (All Dimensions)
1. Launch Puppeteer browser
2. Navigate to `https://mcseedmap.net/1.21.5-Java/{seed}/{dimension}`
3. Handle cookie banner
4. Toggle sidebar for clean view
5. Configure markers (Markers tab → Village)
6. Wait for map to load (~10s)
7. Take full-page screenshot (3840x2160)
8. Crop and resize per size parameter
9. Save → **terrainUrl**
10. **Overworld only:** continue to biome capture (see below)
11. Return URL(s)

### Overworld Dual View (Terrain + Biome)
When dimension is `overworld`, a second screenshot is captured:
1. Click Map Settings tab (`button[title="Map settings"]`)
2. Toggle Terrain estimation off (label containing "Terrain estimation")
3. Wait for map refresh (~10s)
4. Take second screenshot, process identically
5. Save → **biomeUrl**
6. Response includes both `terrainUrl` and `biomeUrl`

### Supported Dimensions
- `overworld` (default)
- `nether`
- `end`

### Supported Sizes
- Integer from 2 to 16 (representing 2k to 16k world size)
- Default: 8 (8k world size)
- Each increment represents 1k blocks

### Image Specifications
- **Format:** PNG
- **Size:** 1000x1000 pixels (final output, regardless of world size)
- **Quality:** High (lossless)
- **File Size:** ~200-500KB typical
- **Storage:** Ephemeral (lost on deployment)

---

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_SEED` | Seed is required and must be a valid string or number |
| `INVALID_DIMENSION` | Dimension must be one of: overworld, nether, end |
| `INVALID_SIZE` | Size must be an integer between 2 and 16 |
| `TOO_MANY_JOBS` | Maximum concurrent jobs exceeded |
| `JOB_NOT_FOUND` | Job ID not found |
| `GENERATION_FAILED` | Map generation process failed |
| `SERVER_ERROR` | Internal server error |
| `NOT_FOUND` | Endpoint not found |

---

## Usage Examples

### JavaScript/Node.js
```javascript
// Generate a map
const response = await fetch('https://mc-map-generator-production.up.railway.app/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    seed: '12345',
    dimension: 'overworld',
    size: 8
  })
});

const { jobId } = await response.json();

// Poll for completion
const pollStatus = async () => {
  const statusResponse = await fetch(`https://mc-map-generator-production.up.railway.app/api/status/${jobId}`);
  const status = await statusResponse.json();
  
  if (status.status === 'ready') {
    console.log('Terrain:', status.terrainUrl);
    if (status.biomeUrl) console.log('Biome:', status.biomeUrl);
    return status;
  } else if (status.status === 'failed') {
    console.error('Generation failed:', status.message);
    return null;
  } else {
    // Still processing, wait and poll again
    setTimeout(pollStatus, 5000);
  }
};

pollStatus();
```

### Python
```python
import requests
import time

# Generate a map
response = requests.post('https://mc-map-generator-production.up.railway.app/api/generate', json={
    'seed': '12345',
    'dimension': 'overworld',
    'size': 8
})

job_id = response.json()['jobId']

# Poll for completion
while True:
    status_response = requests.get(f'https://mc-map-generator-production.up.railway.app/api/status/{job_id}')
    status = status_response.json()
    
    if status['status'] == 'ready':
        print(f"Terrain: {status['terrainUrl']}")
        if status.get('biomeUrl'):
            print(f"Biome: {status['biomeUrl']}")
        break
    elif status['status'] == 'failed':
        print(f"Generation failed: {status['message']}")
        break
    else:
        time.sleep(5)  # Wait 5 seconds before polling again
```

---

## Performance

- **Generation Time:** 30-60 seconds per map
- **Concurrent Jobs:** 3 simultaneous generations
- **Response Time:** <2 seconds for status checks
- **Uptime:** 99%+ availability
- **Error Rate:** <5% failure rate

---

## Support

For issues or questions, please check the service health endpoint first:
`GET /api/health`

The service automatically handles:
- Browser crashes and restarts
- Network timeouts
- Resource cleanup
- Error recovery
