// index.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
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
import { db } from './database.js';

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
        console.log(`\x1b[33m[!] Menyiapkan Pairing Code...\x1b[0m`);
        setTimeout(async () => {
            try {
                let code = await sock.requestPairingCode(config.ownerNumber);
                console.log(`\x1b[32m[+] PAIRING CODE:\x1b[0m \x1b[1m${code}\x1b[0m`);
            } catch (e) { console.log("Gagal pairing."); }
        }, 3000);
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason !== DisconnectReason.loggedOut) startBot();
        } else if (connection === 'open') {
            console.log('\n\x1b[32m[✅] BOT CONNECTED\x1b[0m');
        }
    });

    sock.ev.on('messages.upsert', async (chat) => {
        try {
            const m = chat.messages[0];
            if (!m.message) return;

            const from = m.key.remoteJid;
            const sender = m.key.participant || from;

            // --- AUTO-UPDATE LID ---
            if (sender.includes('@s.whatsapp.net')) {
                db.addContact(sender); 
                const quotedParticipant = m.message.extendedTextMessage?.contextInfo?.participant;
                if (quotedParticipant?.includes('@lid')) {
                    db.updateLidToNumber(quotedParticipant, sender);
                }
            }

            // --- GET BODY (DIBENAHI AGAR LEBIH AKURAT) ---
            let body = (
                m.message.conversation || 
                m.message.extendedTextMessage?.text || 
                m.message.imageMessage?.caption || 
                m.message.videoMessage?.caption || 
                m.message.templateButtonReplyMessage?.selectedId || 
                m.message.buttonsResponseMessage?.selectedButtonId || 
                m.message.viewOnceMessageV2?.message?.imageMessage?.caption || 
                m.message.viewOnceMessageV2?.message?.videoMessage?.caption || 
                ""
            ).trim();

            // Log pesan masuk agar terlihat di terminal
            if (body) {
                console.log(`📩 Pesan: [${body}] | Dari: ${sender}`);
            }

            // --- FILTER PREFIX ---
            if (!body.startsWith('.') && !body.startsWith('$')) return;

            let command, args;
            if (body.startsWith('$')) {
                command = '$';
                args = body.slice(1).trim();
            } else {
                command = body.split(' ')[0].toLowerCase();
                args = body.split(' ').slice(1).join(' ');
            }

            // --- PLUGIN LOADER ---
            const pluginFolder = path.join(process.cwd(), 'plugins');
            const pluginFiles = fs.readdirSync(pluginFolder).filter(file => file.endsWith('.js'));

            for (const file of pluginFiles) {
                try {
                    const pluginPath = pathToFileURL(path.join(pluginFolder, file)).href;
                    // Gunakan update=Date.now agar file plugin yang di-edit langsung terbaca
                    const imported = await import(`${pluginPath}?update=${Date.now()}`);
                    const plugin = imported.default || imported;

                    if (plugin.command && plugin.command.includes(command)) {
                        console.log(`⚡ Exec: ${file} [${command}]`);
                        await plugin.run(sock, m, args, config);
                        return;
                    }
                } catch (err) {
                    console.error(`❌ Error pada plugin ${file}:`, err.message);
                }
            }
        } catch (e) { console.error("[Error Upsert]:", e); }
    });
}

startBot();