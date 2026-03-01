import { v4 as uuidv4 } from 'uuid';

export const generateProjectId = (): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `NCCR-${year}-${random}`;
};

export const generateSubmissionId = (): string => {
    const short = uuidv4().split('-')[0].toUpperCase();
    return `SUB-${short}`;
};

export const generateVerificationId = (): string => {
    const short = uuidv4().split('-')[0].toUpperCase();
    return `VER-${short}`;
};

export const generateTokenId = (): string => {
    const short = uuidv4().split('-')[0].toUpperCase();
    return `TOK-${short}`;
};
