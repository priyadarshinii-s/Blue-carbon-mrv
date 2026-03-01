import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { polygon, polygonAmoy, localhost } from 'wagmi/chains';
import { QueryClient } from '@tanstack/react-query';

const localChain = {
    ...localhost,
    id: 31337,
    name: 'Localhost',
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
    },
};

export const wagmiConfig = getDefaultConfig({
    appName: 'Blue Carbon MRV Registry',
    projectId: 'blue-carbon-mrv-local',
    chains: [polygon, polygonAmoy, localChain],
    transports: {
        [polygon.id]: http(),
        [polygonAmoy.id]: http(),
        [localChain.id]: http('http://127.0.0.1:8545'),
    },
});

export const queryClient = new QueryClient();
