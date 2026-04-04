import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import tailwindcss from '@tailwindcss/vite';

//const certificateName = "shoppinglist.client";
// certFilePath = path.join(baseFolder, `${certificateName}.pem`);
//const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

/*
if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}*/

//const target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
//env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7262';

export default ({ mode }) => {
    // All process/fs/os calls MUST be inside this function
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const homeDir = process.env.HOME || process.env.USERPROFILE || os.homedir();
    const baseFolder =
        process.env.APPDATA && process.env.APPDATA !== ''
            ? path.join(process.env.APPDATA, 'ASP.NET', 'https')
            : path.join(homeDir, '.aspnet', 'https');

    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, { recursive: true });
    }

    const viteEnv = loadEnv(mode, process.cwd(), '');
    const API_URL = Object.prototype.hasOwnProperty.call(viteEnv, 'VITE_API_URL') ? viteEnv.VITE_API_URL : 'http://localhost:7262';

    return defineConfig({
        plugins: [plugin(), tailwindcss()],
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            }
        },
        server: {
            proxy: {
                '/api': API_URL
            }
        }
        /*server: {
            proxy: {
                '/api': {API_URL}
            },
            host: true, //CHANGE THIS FOR LOCAL HOST
            port: parseInt(env.DEV_SERVER_PORT || '64099'),
            https: {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            }*/
    }
    );
};
