// tak kasih info siapa yang buat bot ini, biar ga bingung
export default {
    command: ['.owner', '.creator'],
    run: async (sock, msg, args, config) => {
        const from = msg.key.remoteJid;
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${config.ownerName}
TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}
END:VCARD`;

        await sock.sendMessage(from, {
            contacts: {
                displayName: config.ownerName,
                contacts: [{ vcard }]
            }
        }, { quoted: msg });
    }
};