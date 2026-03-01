import { getPinataConfig } from '../config/pinata';
import { logger } from '../utils/logger';

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

    try {
        const formData = new FormData();
        const blob = new Blob([fileBuffer]);
        formData.append('file', blob, fileName);

        const metadata = JSON.stringify({ name: fileName });
        formData.append('pinataMetadata', metadata);

        const options = JSON.stringify({ cidVersion: 1 });
        formData.append('pinataOptions', options);

        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                pinata_api_key: config.apiKey,
                pinata_secret_api_key: config.secretKey,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Pinata upload failed: ${errorData}`);
        }

        const data = (await response.json()) as { IpfsHash: string };
        logger.info({ cid: data.IpfsHash, fileName }, 'File uploaded to IPFS');
        return data.IpfsHash;
    } catch (error) {
        logger.error({ err: error, fileName }, 'IPFS upload failed');
        throw new Error('Failed to upload file to IPFS');
    }
};

export const uploadJSONToIPFS = async (
    jsonData: Record<string, unknown>,
    name: string
): Promise<string> => {
    const config = getPinataConfig();

    if (!config.apiKey || !config.secretKey) {
        logger.warn('Pinata not configured. Returning placeholder CID for JSON.');
        return `QmJSON${Buffer.from(name).toString('hex').substring(0, 40).padEnd(40, '0')}`;
    }

    try {
        const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                pinata_api_key: config.apiKey,
                pinata_secret_api_key: config.secretKey,
            },
            body: JSON.stringify({
                pinataContent: jsonData,
                pinataMetadata: { name },
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Pinata JSON upload failed: ${errorData}`);
        }

        const data = (await response.json()) as { IpfsHash: string };
        logger.info({ cid: data.IpfsHash, name }, 'JSON uploaded to IPFS');
        return data.IpfsHash;
    } catch (error) {
        logger.error({ err: error, name }, 'IPFS JSON upload failed');
        throw new Error('Failed to upload JSON to IPFS');
    }
};
