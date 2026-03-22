import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { BadRequestError } from '../utils/AppError';
import { uploadFolderToIPFS } from '../services/ipfs.service';
import { logger } from '../utils/logger';

const IPFS_GATEWAY = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs';

/**
 * POST /api/upload/photos
 * Accepts multipart file uploads (via multer), groups them into an IPFS folder,
 * and returns the gateway URLs.
 */
export const uploadPhotos = catchAsync(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
        throw new BadRequestError('Authentication required.');
    }

    const uploadedFiles = req.files as Express.Multer.File[];
    if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new BadRequestError('No files provided.');
    }

    logger.info({ count: uploadedFiles.length }, 'Received files for IPFS upload');

    const folderName = `project-${Date.now()}`;
    const fileBuffers = uploadedFiles.map((f, i) => {
        const ext = f.originalname.split('.').pop() || 'bin';
        return {
            buffer: f.buffer,
            name: `file-${i + 1}.${ext}`,
        };
    });

    const folderCid = await uploadFolderToIPFS(fileBuffers, folderName);
    
    // The IPFS Gateway URL for the root directory itself
    const folderUrl = `${IPFS_GATEWAY}/${folderCid}/`;

    const results = fileBuffers.map((f, i) => ({
        url: `${IPFS_GATEWAY}/${folderCid}/${f.name}`,
        name: f.name,
        index: i,
    }));

    logger.info({ folderCid, count: results.length }, 'Folder uploaded to IPFS successfully');

    res.status(200).json({
        success: true,
        data: {
            uploaded: results.length,
            folderCid,
            folderUrl,
            files: results,
        },
    });
});
