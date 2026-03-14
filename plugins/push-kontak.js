// plugins/push-kontak.js
import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.push', '.jpm'], // Trigger perintah
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

        //LOGIKA CEK OWNER (SUPPORT LID & PHONE) ---
        const sender = msg.key.participant || msg.key.remoteJid || "";
        const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

        if (!isOwner) {
            return sock.sendMessage(from, { 
                text: `❌ Fitur ini hanya untuk Owner!\n\nID Kamu: ${sender}` 
            }, { quoted: msg });
        }

        // 3. Validasi argumen pesan
        if (!args) {
            return sock.sendMessage(from, { text: "⚠️ *Gunakan:* .push {Halo|Hai} kak, salken ya." });
        }

        // 4. Kirim pesan tunggu (Loading)
        await sock.sendMessage(from, { text: config.msgWait || "🚀 Sedang memproses push kontak ke seluruh grup..." });

        try {
            // 5. Ambil semua grup yang bot ikuti
            const groups = await sock.groupFetchAllParticipating();
            const allGroups = Object.values(groups);

            let totalPushed = 0;

            for (let group of allGroups) {
                console.log(`📂 Memproses grup: ${group.subject}`);
                
                for (let participant of group.participants) {
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
            // ... proses kirim pesan ...
            await sock.sendMessage(jid, { text: finalMsg });
            db.addContact(jid);
            // ... sisa kode ...
        } catch (e) { }
    }
}
            }

            // 7. Selesai
            await sock.sendMessage(from, { 
                text: `${config.msgDone || "✅ Push Selesai!"}\n\nTotal nomor baru yang dichat: ${totalPushed}` 
            });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil data grup." });
        }
    }
};