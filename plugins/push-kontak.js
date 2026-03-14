import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.push', '.jpm'], // Trigger perintah
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const isOwner = from.split('@')[0] === config.ownerNumber;

        if (!isOwner) return sock.sendMessage(from, { text: "❌ Fitur ini hanya untuk Owner!" });
        if (!args) return sock.sendMessage(from, { text: "Contoh: .push {Halo|Hai} kak" });

        await sock.sendMessage(from, { text: config.msgWait });

        const groups = await sock.groupFetchAllParticipating();
        const allGroups = Object.values(groups);

        for (let group of allGroups) {
            for (let participant of group.participants) {
                const jid = participant.id;
                if (jid !== sock.user.id && jid.endsWith('@s.whatsapp.net') && !db.isPushed(jid)) {
                    try {
                        // Fitur spintax sederhana
                        const finalMsg = args.replace(/{([^{}]+)}/g, (m, o) => {
                            const c = o.split('|');
                            return c[Math.floor(Math.random() * c.length)];
                        });

                        await sock.sendMessage(jid, { text: finalMsg });
                        db.addContact(jid);

                        const wait = Math.floor(Math.random() * (config.delay.max - config.delay.min)) + config.delay.min;
                        await delay(wait);
                    } catch (e) { console.log(e); }
                }
            }
        }
        await sock.sendMessage(from, { text: config.msgDone });
    }
};