// plugins/push-kontak.js
import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.push', '.jpm'], // Trigger perintah
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

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
    if (!isOwner) {
        return sock.sendMessage(from, { text: "❌ Fitur ini hanya untuk Owner!" }, { quoted: msg });
    }
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
                    const jid = participant.id;

                    // 6. Filter: Bukan bot sendiri, nomor pribadi (bukan grup/newsletter), dan belum di-push
                    if (jid !== sock.user.id && jid.endsWith('@s.whatsapp.net') && !db.isPushed(jid)) {
                        try {
                            // Proses Spintax {Halo|Hai}
                            const finalMsg = args.replace(/{([^{}]+)}/g, (m, o) => {
                                const choices = o.split('|');
                                return choices[Math.floor(Math.random() * choices.length)];
                            });

                            await sock.sendMessage(jid, { text: finalMsg });
                            db.addContact(jid); // Simpan ke database
                            totalPushed++;

                            // Delay acak sesuai config
                            const wait = Math.floor(Math.random() * (config.delay.max - config.delay.min)) + config.delay.min;
                            await delay(wait);
                        } catch (e) { 
                            console.log(`Gagal kirim ke ${jid}`); 
                        }
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