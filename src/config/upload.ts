import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Define upload directory
const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');

// Create upload directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: randomhash-timestamp-originalname
    const randomHash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const uniqueName = `${randomHash}-${timestamp}${ext}`;
    cb(null, uniqueName);
  },
});

// File filter - only allow images
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get upload directory path
export const getUploadDir = (): string => uploadDir;

// Get file URL path
export const getFileUrl = (filename: string): string => {
  return `/uploads/profiles/${filename}`;
};

