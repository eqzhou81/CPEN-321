import crypto from 'crypto';
import { Request } from 'express';
import fs from 'fs';
import multer from 'multer';
import path from 'path';

// Use global Express.Multer.File type from multer augmentation

const IMAGES_DIR = 'uploads/images';

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    const originalname: string = file.originalname ?? '';
    cb(null, `${uniqueSuffix}${path.extname(originalname)}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
