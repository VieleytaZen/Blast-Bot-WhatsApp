// config.js

const config = {
    // --- INFORMASI OWNER ---
    ownerNumber: "6282133692292", // Nomor kamu (tanpa @s.whatsapp.net)
    ownerLid: "83227876290608",     // ID LID kamu (cek di console saat chat bot)
    ownerName: "Kii",
    
    // --- PENGATURAN BOT ---
    botName: "Viel Bot",
    sessionName: "session_esm",     // Nama folder untuk menyimpan session login
    
    // --- PENGATURAN PUSH KONTAK ---
    delay: {
        min: 7000,                  // Jeda minimal (7 detik)
        max: 15000                  // Jeda maksimal (15 detik)
    },

    // --- SOSIAL MEDIA & TAMPILAN ---
    instagramUrl: "https://instagram.com/vieleyta_zen", // Ganti dengan link IG kamu
    thumbnailUrl: "https://telegra.ph/file/241f71128399589d13695.jpg", // Ganti dengan link foto/logo bot
    
    // --- KEAMANAN & LIMIT ---
    // Atur limit sesuai "umur" nomor kamu (Saran: 50 untuk nomor baru, 200 untuk nomor lama)
    maxPushDay: 200,                // Maksimal pesan push per hari
    
    // --- PESAN OTOMATIS ---
    msgWait: "🚀 *Proses Push dimulai...*\nMohon tunggu sebentar ya kak, bot sedang bekerja.",
    msgDone: "✅ *Alhamdulillah, proses push selesai!*",
    msgError: "❌ *Waduh!* Sepertinya ada masalah teknis saat mengirim pesan.",
    msgLimit: "⚠️ *Limit Harian Tercapai!*\nBot berhenti otomatis demi keamanan nomor agar tidak diblokir WhatsApp. Lanjutkan lagi besok ya!"
};

export default config;