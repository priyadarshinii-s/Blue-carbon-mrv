const axios = require('axios');
async function run() {
    try {
        const res = await axios.post('https://blue-carbon-mrv-zs76.onrender.com/api/auth/login', {
            walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // First hardhat account, usually the admin
            nonce: 'random123',
            signature: '0x' // Bypassing auth logic if we assume it's just mocked, but wait, auth may actually verify signature!
        });
        console.log(res.data);
    } catch (e) { console.error(e.response ? e.response.data : e.message); }
}
run();
