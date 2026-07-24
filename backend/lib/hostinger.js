import axios from 'axios';

export const hostingerClient = axios.create({
    baseURL: 'https://developers.hostinger.com',
    headers: {
        'Authorization': `Bearer ${process.env.HOSTINGER_API_TOKEN}`,
        'Content-Type': 'application/json',
    },
});