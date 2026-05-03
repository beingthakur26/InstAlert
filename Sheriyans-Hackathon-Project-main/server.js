import dns from 'node:dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);

import {io,server} from './src/socket/socket.js';
import connectDB from "./src/config/db.js";
// import slaService from './src/services/sla.service.js';

const PORT = process.env.PORT || 3001;

connectDB();



/*
const slaCheckInterval = setInterval(async () => {
    try {
        const breaches = await slaService.checkSLABreaches();
        if (breaches.length > 0) {
            console.log(`[SLA] Detected ${breaches.length} new SLA breach(es)`);
            for (const breach of breaches) {
                const NotificationService = await import('./src/services/notification.service.js');
                await NotificationService.default.notifyAllChannels(
                    breach.organization,
                    'sla.breach',
                    { title: breach.incident?.title || 'Unknown', priority: breach.sla_level },
                );
            }
        }
    } catch (err) {
        console.error('[SLA] Cron check failed:', err.message);
    }
}, 5 * 60 * 1000);
*/

const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);
    // clearInterval(slaCheckInterval);

    server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
            await import('./src/config/db.js').then(({ default: db }) => db.disconnect?.());
            console.log('[DB] Connection closed.');
        } catch {
            process.exit(0);
        }
        process.exit(0);
    });

    setTimeout(() => {
        console.error('[Server] Forced shutdown after 10s timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`InstaAlert server is running on port ${PORT}`);
});
