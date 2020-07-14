import { registerAs } from '@nestjs/config';

export default registerAs('rates', () => ({
    redis_url: process.env.REDIS_URL,
    authorizationHeader: `Bearer ${process.env.WALLET_TOKEN}`,
    apiCertFile: (process.env.APP_CONF || '/app/config') + '/connection-certs/cex.io.pem',
    pssClientUrl: process.env.PSS_CLIENT_URL || 'https://pss-wallet.dev.kube',
    ratesCron: process.env.RATES_CRON,
}));
