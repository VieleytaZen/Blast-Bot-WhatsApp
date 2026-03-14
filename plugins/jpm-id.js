// plugins/jpm-id.js
import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.jpmid', '.pushid'], 
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

       // --- 1. LOGIKA CEK OWNER (SUPPORT LID & PHONE) ---
const sender = msg.key.participant || msg.key.remoteJid || "";
const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

if (!isOwner) {
    return sock.sendMessage(from, { 
        text: `❌ Fitur ini hanya untuk Owner!\n\nID Kamu: ${sender}` 
    }, { quoted: msg });
}
// ----------------------------------------------
        // 2. Validasi Input
        if (!args.includes('|')) {
            return sock.sendMessage(from, { 
                text: `⚠️ *Format Salah!*\n\nGunakan:\n.jpmid ID_GRUP | PESAN\n\nContoh:\n.jpmid 120363xxx@g.us | Halo {kak|bang}, salken.` 
            }, { quoted: msg });
        }

        const [targetId, ...pesanArray] = args.split('|');
        const targetIdTrimmed = targetId.trim();
        const pesan = pesanArray.join('|').trim();

        if (!targetIdTrimmed || !pesan) {
            return sock.sendMessage(from, { text: "⚠️ ID Grup atau Pesan tidak boleh kosong!" });
        }

        try {
            // 3. Ambil Metadata Grup
            const metadata = await sock.groupMetadata(targetIdTrimmed);
            const participants = metadata.participants;

            await sock.sendMessage(from, { 
                text: `🚀 *Memulai Push Kontak*\n\nTarget: ${metadata.subject}\nTotal Anggota: ${participants.length}\n\n_Bot akan melewati nomor yang sudah pernah dichat sebelumnya._` 
            });

let success = 0;
const finalMsg = pesan; // Define the message to send

for (let participant of participants) {
    let jid = participant.id;

    // 1. FILTER: Hanya ambil yang berakhiran @s.whatsapp.net (Nomor Asli)
    // Abaikan yang berakhiran @lid
    if (jid.includes('@lid')) continue; 

    // 2. Filter: Bukan diri sendiri
    const isMe = jid.includes(sock.user.id.split(':')[0]);
    if (isMe) continue;

    // 3. Cek Database
    if (!db.isPushed(jid)) {
        try {
            await sock.sendMessage(jid, { text: finalMsg });
            db.addContact(jid);
            success++;
        } catch (e) { }
    }
}

            await sock.sendMessage(from, { 
                text: `✅ *Push Selesai!*\n\nBerhasil kirim ke: ${success} nomor baru.\nGrup: ${metadata.subject}` 
            }, { quoted: msg });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(from, { 
                text: `❌ *Error!*\n\nPastikan ID Grup benar dan bot sudah bergabung di grup tersebut.` 
            });
        }
    }
};