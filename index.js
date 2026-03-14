import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import fs from "fs";
import path from "path";
import { pathToFileURL } from 'url'; // Tambahkan ini untuk kompatibilitas ESM
import config from './config.js';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionName);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        console.log(`\n\x1b[33m[!] Menyiapkan Pairing Code untuk nomor: ${config.ownerNumber}\x1b[0m`);
        setTimeout(async () => {
            let code = await sock.requestPairingCode(config.ownerNumber);
            console.log(`\n\x1b[32m[+] KODE PAIRING ANDA:\x1b[0m \x1b[1m${code}\x1b[0m\n`);
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(`[!] Koneksi terputus (Reason: ${reason}). Mencoba menghubungkan kembali...`);
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n\x1b[32m[✅] BOT BERHASIL TERHUBUNG KE WHATSAPP\x1b[0m');
            console.log(`\x1b[36m[i] Halo ${config.ownerName}, bot sudah siap digunakan.\x1b[0m\n`);
        }
    });

    // --- Hanya gunakan SATU messages.upsert ---
    sock.ev.on('messages.upsert', async (chat) => {
        try {
            const m = chat.messages[0];
            if (!m.message || m.key.fromMe) return;

            const body = m.message.conversation || m.message.extendedTextMessage?.text || "";
            const from = m.key.remoteJid;

            // Log untuk debug (Muncul di terminal)
            console.log(`📩 Pesan Masuk: [${body}] dari ${from}`);

            // Cek apakah pesan diawali titik
            if (!body.startsWith('.')) return; 

            const command = body.split(' ')[0].toLowerCase();
            const args = body.split(' ').slice(1).join(' ');

            // Membaca folder plugins
            const pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'));

            for (const file of pluginFiles) {
                const pluginPath = path.join(process.cwd(), 'plugins', file);
                // Menggunakan pathToFileURL agar import ESM stabil di Linux/Windows
                const plugin = await import(pathToFileURL(pluginPath).href + `?update=${Date.now()}`);

                if (plugin.default.command.includes(command)) {
                    await plugin.default.run(sock, m, args, config);
                }
            }
        } catch (err) {
            console.error(`[Error Loader]:`, err);
        }
    });
}

console.log('\x1b[36m[i] Memulai sistem...\x1b[0m');
startBot();