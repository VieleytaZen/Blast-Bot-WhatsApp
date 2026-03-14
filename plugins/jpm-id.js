import { db } from '../database.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
    command: ['.jpmid', '.pushid'], // Perintah baru
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        // Cara yang lebih aman untuk cek owner
            console.log(`ID Pengirim: ${from}`);
            console.log(`Nomor Owner di Config: ${config.ownerNumber}`);
        const isOwner = from.split('@')[0].includes(config.ownerNumber);

        // 1. Keamanan: Hanya Owner yang bisa akses
        if (!isOwner) return sock.sendMessage(from, { text: "❌ Fitur ini hanya untuk Owner!" });

        // 2. Validasi Input
        // Format: .jpmid ID_GRUP | PESAN
        const [targetId, ...pesanArray] = args.split('|');
        const pesan = pesanArray.join('|').trim();

        if (!targetId || !pesan) {
            return sock.sendMessage(from, { 
                text: `Format Salah!\n\nContoh:\n.jpmid 120363xxx@g.us | {Halo|Hai} kak, salken ya.` 
            });
        }

        try {
            // 3. Ambil Metadata Grup berdasarkan ID
            const metadata = await sock.groupMetadata(targetId.trim());
            const participants = metadata.participants;

            await sock.sendMessage(from, { 
                text: `🚀 Memulai Push Kontak ke grup: *${metadata.subject}*\nTotal anggota: ${participants.length}\nEstimasi waktu: ${((participants.length * config.delay.min) / 1000).toFixed(0)} detik.` 
            });

            let success = 0;
            for (let mem of participants) {
                const jid = mem.id;

                // Validasi: Bukan diri sendiri & belum pernah di-push
                if (jid !== sock.user.id && jid.endsWith('@s.whatsapp.net') && !db.isPushed(jid)) {
                    try {
                        // Spintax
                        const finalMsg = pesan.replace(/{([^{}]+)}/g, (m, o) => {
                            const c = o.split('|');
                            return c[Math.floor(Math.random() * c.length)];
                        });

                        await sock.sendMessage(jid, { text: finalMsg });
                        db.addContact(jid);
                        success++;

                        // Delay Acak
                        const wait = Math.floor(Math.random() * (config.delay.max - config.delay.min)) + config.delay.min;
                        await delay(wait);
                    } catch (e) {
                        console.log(`Gagal kirim ke ${jid}`);
                    }
                }
            }

            await sock.sendMessage(from, { text: `✅ Selesai! Berhasil mengirim ke ${success} anggota baru di grup ${metadata.subject}.` });

        } catch (err) {
            await sock.sendMessage(from, { text: `❌ ID Grup tidak ditemukan atau bot tidak ada di dalam grup tersebut.` });
        }
    }
};