import { Router } from 'express';

import { upload } from '../config /config/storage';
import { MediaController } from '../controllers/media.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const mediaController = new MediaController();

router.post(
  '/upload',
  authenticateToken,
  upload.single('media'),
  mediaController.uploadImage
);

export default router;
