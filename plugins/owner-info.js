// plugins/owner-info.js
// Script ini di buat oleh Viel, jangan di hapus credit nya ya kak 🙏
// Untuk pertanyaan, saran, atau ingin request fitur bisa langsung DM ke Instagram saya: https://instagram.com/vieleyta_zen
export default {
    command: ['.owner', '.creator'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // Cek jika ownerNumber ada, jika tidak ada pakai fallback nomor kosong
        const rawNumber = config.ownerNumber || "";
        const cleanNumber = rawNumber.replace(/\D/g, '');

        if (!cleanNumber) {
            return sock.sendMessage(from, { text: "❌ Nomor owner belum diatur di config.js" });
        }

        const vcard = 'BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    `FN:${config.ownerName}\n` +
                    `ORG:Owner ${config.botName};\n` +
                    `TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\n` +
                    'END:VCARD';

        await sock.sendMessage(from, {
            contacts: {
                displayName: config.ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: msg });
    }
};