/**
 * Image Upload API for Nostr BBS
 * Cloud Run service that handles image compression and GCS storage
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 8080;

// GCS Configuration
const BUCKET_NAME = process.env.GCS_BUCKET || 'minimoonoir-images';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'cumbriadreamlab';

// Initialize GCS client
const storage = new Storage({ projectId: PROJECT_ID });
const bucket = storage.bucket(BUCKET_NAME);

// Multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 2 // image + optional thumbnail
  },
  fileFilter: (_req: express.Request, file: { mimetype: string }, cb: (error: Error | null, acceptFile?: boolean) => void) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// CORS configuration
const corsOptions = {
  origin: [
    'https://jjohare.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'image-api', timestamp: new Date().toISOString() });
});

/**
 * Image compression settings by category
 */
const COMPRESSION_SETTINGS = {
  avatar: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 90,
    format: 'jpeg' as const
  },
  message: {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 85,
    format: 'jpeg' as const
  },
  channel: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 85,
    format: 'jpeg' as const
  },
  thumbnail: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 80,
    format: 'jpeg' as const
  }
};

/**
 * Generate Keybase-style file URI
 * Format: UUID-SIZE-TIMESTAMP_HEX
 * Example: D944AEC6-4F5D-420D-9833-EBC6C73465FD-1180-000000145FF7DC4A
 */
function generateKeybaseStyleId(buffer: Buffer): string {
  // Generate UUID (uppercase, with hyphens)
  const uuid = uuidv4().toUpperCase();

  // File size component (in bytes, 4 digits padded)
  const size = buffer.length;
  const sizeComponent = size.toString().slice(0, 4).padStart(4, '0');

  // Timestamp as hex (16 chars, zero-padded)
  const timestamp = Date.now();
  const timestampHex = timestamp.toString(16).toUpperCase().padStart(16, '0');

  return `${uuid}-${sizeComponent}-${timestampHex}`;
}

/**
 * Parse Keybase-style file URI back to components
 */
function parseKeybaseStyleId(id: string): {
  uuid: string;
  size: number;
  timestamp: number;
} | null {
  const parts = id.split('-');
  if (parts.length < 7) return null;

  // Reconstruct UUID (first 5 parts)
  const uuid = parts.slice(0, 5).join('-');

  // Size is 6th part
  const size = parseInt(parts[5], 10);

  // Timestamp is 7th part (hex)
  const timestamp = parseInt(parts[6], 16);

  return { uuid, size, timestamp };
}

/**
 * Compress image using sharp
 */
async function compressImage(
  buffer: Buffer,
  settings: typeof COMPRESSION_SETTINGS[keyof typeof COMPRESSION_SETTINGS]
): Promise<Buffer> {
  let processor = sharp(buffer)
    .resize(settings.maxWidth, settings.maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });

  if (settings.format === 'jpeg') {
    processor = processor.jpeg({ quality: settings.quality, progressive: true });
  } else if (settings.format === 'webp') {
    processor = processor.webp({ quality: settings.quality });
  } else {
    processor = processor.png({ compressionLevel: 9 });
  }

  return processor.toBuffer();
}

/**
 * Upload buffer to GCS
 */
async function uploadToGCS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const file = bucket.file(filename);

  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'public, max-age=31536000' // 1 year cache
    }
  });

  // Make publicly accessible
  await file.makePublic();

  return `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
}

/**
 * Main upload endpoint
 */
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const pubkey = req.body.pubkey || 'anonymous';
    const category = (req.body.category || 'message') as keyof typeof COMPRESSION_SETTINGS;

    // Validate category
    if (!COMPRESSION_SETTINGS[category]) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    const settings = COMPRESSION_SETTINGS[category];

    // Get image metadata
    const metadata = await sharp(req.file.buffer).metadata();
    const originalSize = req.file.size;

    // Compress main image
    const compressedBuffer = await compressImage(req.file.buffer, settings);
    const compressedSize = compressedBuffer.length;

    // Generate Keybase-style unique ID
    const imageId = generateKeybaseStyleId(compressedBuffer);
    const filename = `${category}/${pubkey.slice(0, 8)}/${imageId}.jpg`;

    // Upload main image
    const url = await uploadToGCS(compressedBuffer, filename, 'image/jpeg');

    // Generate and upload thumbnail for non-avatar images
    let thumbnailUrl: string | undefined;
    if (category !== 'avatar') {
      const thumbBuffer = await compressImage(req.file.buffer, COMPRESSION_SETTINGS.thumbnail);
      const thumbFilename = `${category}/${pubkey.slice(0, 8)}/${imageId}_thumb.jpg`;
      thumbnailUrl = await uploadToGCS(thumbBuffer, thumbFilename, 'image/jpeg');
    }

    // Log upload
    console.log(`Image uploaded: ${filename} (${originalSize} -> ${compressedSize} bytes)`);

    res.json({
      success: true,
      url,
      thumbnailUrl,
      imageId,
      metadata: {
        originalSize,
        compressedSize,
        compressionRatio: (1 - compressedSize / originalSize).toFixed(2),
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Upload failed'
    });
  }
});

/**
 * Batch upload endpoint (for multiple images)
 */
app.post('/upload-batch', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const pubkey = req.body.pubkey || 'anonymous';
    const category = (req.body.category || 'message') as keyof typeof COMPRESSION_SETTINGS;
    const settings = COMPRESSION_SETTINGS[category];

    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const compressedBuffer = await compressImage(file.buffer, settings);
          const imageId = generateKeybaseStyleId(compressedBuffer);
          const filename = `${category}/${pubkey.slice(0, 8)}/${imageId}.jpg`;
          const url = await uploadToGCS(compressedBuffer, filename, 'image/jpeg');

          return { success: true, url, imageId };
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
          };
        }
      })
    );

    res.json({ results });
  } catch (error) {
    console.error('Batch upload error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Batch upload failed'
    });
  }
});

/**
 * Delete image endpoint (requires authentication)
 */
app.delete('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    const pubkey = req.body.pubkey;

    if (!pubkey) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find and delete the file
    const [files] = await bucket.getFiles({
      prefix: `message/${pubkey.slice(0, 8)}/${imageId}`
    });

    if (files.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await Promise.all(files.map(file => file.delete()));

    res.json({ success: true, deleted: files.length });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Delete failed'
    });
  }
});

/**
 * Get image info endpoint
 */
app.get('/info/:category/:pubkey/:imageId', async (req, res) => {
  try {
    const { category, pubkey, imageId } = req.params;
    const filename = `${category}/${pubkey}/${imageId}.jpg`;

    const file = bucket.file(filename);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const [metadata] = await file.getMetadata();

    res.json({
      url: `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`,
      size: metadata.size,
      contentType: metadata.contentType,
      created: metadata.timeCreated,
      cacheControl: metadata.cacheControl
    });
  } catch (error) {
    console.error('Info error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get image info'
    });
  }
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Image API server running on port ${PORT}`);
  console.log(`GCS Bucket: ${BUCKET_NAME}`);
  console.log(`Project: ${PROJECT_ID}`);
});
