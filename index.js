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
import { pathToFileURL } from 'url';
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
        console.log(`\n\x1b[33m[!] Menyiapkan Pairing Code untuk: ${config.ownerNumber}\x1b[0m`);
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(config.ownerNumber);
                console.log(`\n\x1b[32m[+] KODE PAIRING ANDA:\x1b[0m \x1b[1m${code}\x1b[0m\n`);
            } catch (e) {
                console.log("[!] Gagal meminta pairing code, silakan restart.");
            }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(`[!] Koneksi terputus (Reason: ${reason}). Reconnecting...`);
            if (reason !== DisconnectReason.loggedOut) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('\n\x1b[32m[✅] BOT BERHASIL TERHUBUNG KE WHATSAPP\x1b[0m');
            console.log(`\x1b[36m[i] Halo ${config.ownerName}, bot sudah siap digunakan.\x1b[0m\n`);
        }
    });

    sock.ev.on('messages.upsert', async (chat) => {
        try {
            const m = chat.messages[0];
            if (!m.message) return;

            const from = m.key.remoteJid;
            const sender = m.key.participant || from;

            // Memperbaiki pengambilan teks (Body) agar mendukung pesan bot sendiri & orang lain
            let body = (
                m.message.conversation || 
                m.message.extendedTextMessage?.text || 
                m.message.imageMessage?.caption || 
                m.message.videoMessage?.caption || 
                m.message.viewOnceMessageV2?.message?.imageMessage?.caption ||
                m.message.viewOnceMessageV2?.message?.videoMessage?.caption ||
                ""
            ).trim();

            // Tambahan jika pesan berasal dari bot sendiri (m.key.fromMe)
            if (m.key.fromMe && !body) {
                body = (m.message.quotedMessage?.conversation || 
                        m.message.quotedMessage?.extendedTextMessage?.text || 
                        "").trim();
            }

            if (body) {
                console.log(`📩 Pesan Masuk: [${body}]`);
                console.log(`   Dari: ${from}`);
                console.log(`   Oleh: ${sender}`);
            }

            // Hanya proses perintah yang diawali titik
            if (!body.startsWith('.')) return; 

            const command = body.split(' ')[0].toLowerCase();
            const args = body.split(' ').slice(1).join(' ');

            const pluginFolder = path.join(process.cwd(), 'plugins'); 
            if (!fs.existsSync(pluginFolder)) return;

            const pluginFiles = fs.readdirSync(pluginFolder).filter(file => file.endsWith('.js'));

            for (const file of pluginFiles) {
                try {
                    const pluginPath = pathToFileURL(path.join(pluginFolder, file)).href;
                    const imported = await import(`${pluginPath}?update=${Date.now()}`);
                    const plugin = imported.default || imported;

                    if (plugin && plugin.command && plugin.command.includes(command)) {
                        console.log(`⚡ Menjalankan: ${file} untuk perintah [${command}]`);
                        await plugin.run(sock, m, args, config);
                        return; 
                    }
                } catch (err) {
                    console.error(`❌ Gagal memuat plugin ${file}:`, err.message);
                }
            }
        } catch (err) {
            console.error(`[Error Global]:`, err);
        }
    });
}

console.log('\x1b[36m[i] Memulai bot... Pastikan nomor owner di config sudah benar.\x1b[0m\n');
startBot();