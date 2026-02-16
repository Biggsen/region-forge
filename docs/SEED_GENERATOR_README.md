# Minecraft Seed Map Generator

This feature allows you to generate high-quality Minecraft maps from any seed and import them into the MC Region Maker.

## How to Use

### 1. Start the Map Generator Service

The application uses an external microservice for map generation. For local development:
- The service should be running on `http://localhost:3001`
- Start your frontend development server: `npm run dev`

### 2. Generate a Map from Seed

1. Open the MC Region Maker app in your browser (typically `http://localhost:3000`)
2. Navigate to the **Map** tab
3. In the "Generate from Seed" section:
   - Enter any Minecraft seed (number or text)
   - Select dimension (Overworld, Nether, or End)
   - Adjust world size if generating Overworld (2k-16k)
4. Click **"Generate Map Image"**
   - The service will process your request (takes 30-60 seconds)
   - Progress indicators show the generation status
5. Preview the generated map in the preview section
6. Click **"Import Map"** to bring it into the main app

### 3. Features of Generated Maps

- **High Quality**: 1000x1000 pixel PNG images
- **Dual Layers (Overworld)**: Terrain heightmap + biome color map imported together
- **Fast Processing**: Async job-based generation with status polling
- **Multiple Dimensions**: Supports Overworld, Nether, and End
- **Configurable Sizes**: World sizes from 2k to 16k blocks
- **Clean Output**: Optimized images ready for region mapping

### 4. Technical Details

- **Service**: External MC Map Generator microservice
- **API**: RESTful API with async job pattern
- **Technology**: Uses Puppeteer for browser automation and Sharp for image processing
- **Response Time**: 30-60 seconds per map generation
- **Concurrent Jobs**: Supports up to 3 simultaneous generations

## API Endpoints

The map generation service provides the following endpoints:

- `POST /api/generate` - Start a map generation job
  - Request: `{ seed, dimension, size }`
  - Response: `{ jobId, status, estimatedTime }`
  
- `GET /api/status/{jobId}` - Check job status
  - Response: `{ status, terrainUrl, biomeUrl?, imageUrl }` (when ready; Overworld returns both terrain and biome)
  
- `GET /api/health` - Service health check

## Troubleshooting

- **Service Not Available**: Make sure the map generator service is running on port 3001
- **Generation Timeout**: Check the service logs for errors
- **Connection Errors**: Verify the service URL in your environment
- **Slow Generation**: Normal processing time is 30-60 seconds per map

## Migration Notes

The old local API server (`api-server.js`) and screenshot script (`screenshot-mcseedmap.js`) have been replaced by this microservice architecture.
