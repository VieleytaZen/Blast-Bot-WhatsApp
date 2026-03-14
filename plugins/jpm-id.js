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
            for (let mem of participants) {
                // Ambil ID asli (bisa berupa nomor biasa atau LID)
                const jid = mem.id;

                // 1. Cek apakah ini bot sendiri? Jika ya, lewati.
                const isMe = jid.includes(sock.user.id.split(':')[0]);
                if (isMe) continue;

                // 2. Cek apakah nomor ini sudah pernah dichat/ada di database?
                // Kita bersihkan dulu JID-nya agar pencarian di DB akurat
                const cleanJid = jid.split(':')[0].split('@')[0]; 
                
                // Cek di database (kita buat pengecekan yang lebih fleksibel)
                const alreadyPushed = db.isPushed(cleanJid) || db.isPushed(jid);

                if (!alreadyPushed) {
                    try {
                        // Proses Spintax
                        const finalMsg = pesan.replace(/{([^{}]+)}/g, (m, o) => {
                            const choices = o.split('|');
                            return choices[Math.floor(Math.random() * choices.length)];
                        });

                        await sock.sendMessage(jid, { text: finalMsg });
                        
                        // Simpan ke database (simpan keduanya agar aman)
                        db.addContact(cleanJid); 
                        db.addContact(jid);
                        
                        success++;

                        // Delay
                        const wait = Math.floor(Math.random() * (config.delay.max - config.delay.min)) + config.delay.min;
                        await delay(wait);
                    } catch (e) {
                        console.log(`❌ Gagal kirim ke ${jid}:`, e.message);
                    }
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