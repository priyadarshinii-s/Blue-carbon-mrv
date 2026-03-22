import { Router } from 'express';
import multer from 'multer';
import { uploadPhotos } from '../controllers/upload.controller';
import { protect } from '../middlewares/auth';

const router = Router();

// Use multer memory storage - files available as req.files[].buffer
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/gif',
                         'video/mp4', 'video/webm', 'video/quicktime'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not supported`));
        }
    },
});

// Accept up to 10 files in the 'files' field
router.post('/photos', protect, upload.array('files', 10), uploadPhotos);

export default router;
