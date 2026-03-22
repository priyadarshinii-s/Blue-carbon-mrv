import { uploadToIPFS } from './src/services/ipfs.service';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
    try {
        const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const buf = Buffer.from(b64, 'base64');
        const cid = await uploadToIPFS(buf, 'test.png');
        console.log("Success CID:", cid);
    } catch (e) {
        console.error("Test Failed:", e.message);
    }
})();
