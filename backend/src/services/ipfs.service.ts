import FormData from 'form-data';
import https from 'https';
import { getPinataConfig } from '../config/pinata';
import { logger } from '../utils/logger';

const PINATA_FILE_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/**
 * Upload a file buffer to IPFS via Pinata using form-data + https
 */
export const uploadToIPFS = async (
    fileBuffer: Buffer,
    fileName: string
): Promise<string> => {
    const config = getPinataConfig();

    if (!config.apiKey || !config.secretKey) {
        logger.warn('Pinata not configured. Returning placeholder CID.');
        const placeholderCid = `Qm${Buffer.from(fileName).toString('hex').substring(0, 44).padEnd(44, '0')}`;
        return placeholderCid;
    }

    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', fileBuffer, {
            filename: fileName,
            contentType: 'application/octet-stream',
        });
        form.append('pinataMetadata', JSON.stringify({ name: fileName }));
        form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        const url = new URL(PINATA_FILE_URL);

        const options: https.RequestOptions = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                pinata_api_key: config.apiKey,
                pinata_secret_api_key: config.secretKey,
            },
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const data = JSON.parse(body) as { IpfsHash: string };
                        logger.info({ cid: data.IpfsHash, fileName }, 'File uploaded to IPFS');
                        resolve(data.IpfsHash);
                    } catch (e) {
                        reject(new Error(`Failed to parse Pinata response: ${body}`));
                    }
                } else {
                    logger.error({ statusCode: res.statusCode, body }, 'Pinata upload failed');
                    reject(new Error(`Pinata upload failed (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', (err) => {
            logger.error({ err, fileName }, 'IPFS upload request error');
            reject(new Error(`IPFS upload request failed: ${err.message}`));
        });

        form.pipe(req);
    });
};

/**
 * Upload an array of files as a single directory to IPFS via Pinata
 */
export const uploadFolderToIPFS = async (
    files: { buffer: Buffer; name: string }[],
    folderName: string
): Promise<string> => {
    const config = getPinataConfig();

    if (!config.apiKey || !config.secretKey) {
        logger.warn('Pinata not configured. Returning placeholder folder CID.');
        return `QmFolder${Buffer.from(folderName).toString('hex').substring(0, 38).padEnd(38, '0')}`;
    }

    return new Promise((resolve, reject) => {
        const form = new FormData();
        
        // Append all files with their relative paths to create a directory structure
        files.forEach((f) => {
            form.append('file', f.buffer, {
                filename: f.name,
                filepath: `${folderName}/${f.name}`,
                contentType: 'application/octet-stream',
            });
        });

        form.append('pinataMetadata', JSON.stringify({ name: folderName }));
        form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

        const url = new URL(PINATA_FILE_URL);

        const options: https.RequestOptions = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                pinata_api_key: config.apiKey,
                pinata_secret_api_key: config.secretKey,
            },
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const data = JSON.parse(body) as { IpfsHash: string };
                        logger.info({ cid: data.IpfsHash, folderName }, 'Folder uploaded to IPFS');
                        resolve(data.IpfsHash);
                    } catch (e) {
                        reject(new Error(`Failed to parse Pinata response: ${body}`));
                    }
                } else {
                    logger.error({ statusCode: res.statusCode, body }, 'Pinata folder upload failed');
                    reject(new Error(`Pinata upload failed (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', (err) => {
            logger.error({ err, folderName }, 'IPFS folder upload request error');
            reject(new Error(`IPFS upload request failed: ${err.message}`));
        });

        form.pipe(req);
    });
};

/**
 * Upload JSON data to IPFS via Pinata
 */
export const uploadJSONToIPFS = async (
    jsonData: Record<string, unknown>,
    name: string
): Promise<string> => {
    const config = getPinataConfig();

    if (!config.apiKey || !config.secretKey) {
        logger.warn('Pinata not configured. Returning placeholder CID for JSON.');
        return `QmJSON${Buffer.from(name).toString('hex').substring(0, 40).padEnd(40, '0')}`;
    }

    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            pinataContent: jsonData,
            pinataMetadata: { name },
        });

        const url = new URL(PINATA_JSON_URL);

        const options: https.RequestOptions = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                pinata_api_key: config.apiKey,
                pinata_secret_api_key: config.secretKey,
            },
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const data = JSON.parse(body) as { IpfsHash: string };
                        logger.info({ cid: data.IpfsHash, name }, 'JSON uploaded to IPFS');
                        resolve(data.IpfsHash);
                    } catch (e) {
                        reject(new Error(`Failed to parse Pinata response: ${body}`));
                    }
                } else {
                    logger.error({ statusCode: res.statusCode, body }, 'Pinata JSON upload failed');
                    reject(new Error(`Pinata JSON upload failed (${res.statusCode}): ${body}`));
                }
            });
        });

        req.on('error', (err) => {
            logger.error({ err, name }, 'IPFS JSON upload request error');
            reject(new Error(`IPFS JSON upload request failed: ${err.message}`));
        });

        req.write(payload);
        req.end();
    });
};
