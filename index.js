// index.js
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
            console.log('\x1b[32m[✅] BOT CONNECTED\x1b[0m');
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

            // --- GET BODY ---
            let body = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "").trim();

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
                const pluginPath = pathToFileURL(path.join(pluginFolder, file)).href;
                const imported = await import(`${pluginPath}?v=${Date.now()}`);
                const plugin = imported.default || imported;

                if (plugin.command && plugin.command.includes(command)) {
                    await plugin.run(sock, m, args, config);
                    return;
                }
            }
        } catch (e) { console.error(e); }
    });
}

startBot();