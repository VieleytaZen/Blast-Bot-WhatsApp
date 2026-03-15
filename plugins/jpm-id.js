// plugins/jpm-id.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
import { db } from '../database.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.jpmid', '.pushid'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || from;
        const isOwner = config.owners.some(id => sender.includes(id));

        if (!isOwner) return sock.sendMessage(from, { text: "❌ Khusus Owner!" });
        if (!args.includes('|')) return sock.sendMessage(from, { text: "Format: .jpmid ID|Pesan" });

        const [id, ...text] = args.split('|');
        const target = id.trim();
        const pesan = text.join('|').trim();

        const metadata = await sock.groupMetadata(target).catch(() => null);
        if (!metadata) return sock.sendMessage(from, { text: "ID Grup Salah!" });

        await sock.sendMessage(from, { text: config.msgWait });

        for (let p of metadata.participants) {
            const jid = p.id;
            if (jid.includes(sock.user.id.split(':')[0]) || db.isPushed(jid)) continue;
            
            if (db.getTodayCount() >= config.maxPushDay) {
                await sock.sendMessage(from, { text: config.msgLimit });
                break;
            }

            try {
                await sock.sendMessage(jid, { text: pesan });
                db.addContact(jid);
                db.incrementTodayCount();
                await delay(Math.floor(Math.random() * (config.delay.max - config.delay.min)) + config.delay.min);
            } catch (e) {}
        }
        await sock.sendMessage(from, { text: config.msgDone });
    }
};