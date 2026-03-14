// plugins/reset-pushkontak.js
import { db } from '../database.js';

export default {
    command: ['.reset', '.cleardb'], // Perintah yang memicu plugin
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // 1. Logika Keamanan Owner (Mendukung di Grup & Pribadi)
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
    }}

        // 2. Mengambil argumen (misal: export)
        const type = args.toLowerCase().trim();

        if (type === 'export') {
            // Memanggil fungsi dari database.js
            db.clearExport();
            
            await sock.sendMessage(from, { 
                text: "✅ *Riwayat Ekspor Berhasil Direset!*\n\nSekarang perintah `.export` akan mengambil seluruh nomor yang ada di database dari awal lagi (tidak hanya nomor baru)." 
            }, { quoted: msg });

        } else if (type === 'all') {
            // Pengamanan agar database utama tidak terhapus tidak sengaja
            await sock.sendMessage(from, { 
                text: "⚠️ Fitur reset total dinonaktifkan demi keamanan.\n\nGunakan perintah: *.reset export*" 
            }, { quoted: msg });

        } else {
            // Pesan bantuan jika user salah ketik atau tanpa argumen
            const helpText = `❓ *Cara Menggunakan Reset*:\n\n` +
                             `Ketik: *.reset export*\n\n` +
                             `_Fungsi: Menghapus tanda 'sudah diekspor' sehingga semua nomor di database bisa didownload ulang._`;
            
            await sock.sendMessage(from, { text: helpText }, { quoted: msg });
        }
    }
};