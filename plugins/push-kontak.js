// plugins/push-kontak.js
import { db } from '../database.js';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.push', '.jpm'], 
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;

        // --- 1. LOGIKA CEK OWNER ---
        const sender = msg.key.participant || msg.key.remoteJid || "";
        const isOwner = sender.includes(config.ownerNumber) || sender.includes(config.ownerLid);

        if (!isOwner) {
            return sock.sendMessage(from, { 
                text: `❌ Fitur ini hanya untuk Owner!\n\nID Kamu: ${sender}` 
            }, { quoted: msg });
        }

        // 2. Validasi Pesan
        if (!args) {
            return sock.sendMessage(from, { text: "⚠️ *Gunakan:* .push {Halo|Hai} kak, salken ya." });
        }

        // 3. Info Awal
        await sock.sendMessage(from, { text: config.msgWait || "🚀 Sedang memproses push kontak ke seluruh grup..." });

        try {
            // 4. Ambil semua grup
            const groups = await sock.groupFetchAllParticipating();
            const allGroups = Object.values(groups);

            let totalPushed = 0;

            for (let group of allGroups) {
                console.log(`📂 Memproses grup: ${group.subject}`);
                
                // Pastikan participants ada
                const participants = group.participants || [];

                for (let participant of participants) {
                    let jid = participant.id;

                    // --- FILTER LID DIHAPUS (Agar semua ID terkirim) ---
                    // if (jid.includes('@lid')) continue; 

                    // 1. Filter: Bukan bot sendiri
                    const isMe = jid.includes(sock.user.id.split(':')[0]);
                    if (isMe) continue;

                    // 2. Cek Database
                    if (!db.isPushed(jid)) {
                        try {
                            // Spintax {Halo|Hai}
                            const finalMsg = args.replace(/{([^{}]+)}/g, (m, o) => {
                                const choices = o.split('|');
                                return choices[Math.floor(Math.random() * choices.length)];
                            });

                            // Kirim Pesan
                            await sock.sendMessage(jid, { text: finalMsg });
                            
                            // Simpan ke database
                            db.addContact(jid);
                            totalPushed++;

                            // --- JEDA AMAN (PENTING) ---
                            // Gunakan delay dari config atau minimal 3-5 detik
                            const waitTime = Math.floor(Math.random() * (config.delay.max - config.delay.min)) + config.delay.min;
                            await delay(waitTime || 5000);

                        } catch (e) { 
                            console.log(`❌ Gagal kirim ke ${jid}:`, e.message); 
                        }
                    }
                }
            }

            // 5. Selesai
            await sock.sendMessage(from, { 
                text: `${config.msgDone || "✅ *Push Selesai!*"}\n\nTotal nomor baru yang dichat: ${totalPushed}` 
            });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(from, { text: "❌ Terjadi kesalahan saat mengambil data grup." });
        }
    }
};