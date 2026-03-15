// plugins/owner-info.js
export default {
    command: ['.owner', '.creator'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        
        // Buat vCard yang benar menggunakan nomor HP asli
        const vcard = 'BEGIN:VCARD\n' +
                    'VERSION:3.0\n' +
                    `FN:${config.ownerName}\n` +
                    `TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\n` +
                    'END:VCARD';

        await sock.sendMessage(from, {
            contacts: {
                displayName: config.ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: msg });
    }
};