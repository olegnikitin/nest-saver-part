import { HttpService, Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { RedisService } from 'nestjs-redis';
import { Pipeline, Redis } from 'ioredis';
import { PssClient } from './pss-client';
import { ConfigType } from '@nestjs/config';
import RatesConfig from './rates.config';
import { tickers_collector } from './collectors-config.json';
import { SourceEnum } from './rate';
import { CexClient } from './cex-client';
import { BitfinexClient } from './bitfinex-client';
import { BitstampClient } from './bitstamp-client';
import { KrakenClient } from './kraken-client';
import { CoinbaseClient } from './coinbase-client';
import { BinanceClient } from './binance-client';
import { BitrexClient } from './bitrex-client';
import { GeminiClient } from './gemini-client';

const { cex, bitfinex, bitstamp, kraken, coinbase, binance, bitrex, gemini } = tickers_collector;

const indexRates = 'index:rates';

@Injectable()
export class RatesService implements OnModuleDestroy {
    private readonly logger = new Logger(RatesService.name);
    private readonly pssStorage: PssClient;
    private readonly cexClient: CexClient;
    private readonly bitfinexClient: BitfinexClient;
    private readonly bitstampClient: BitstampClient;
    private readonly krakenClient: KrakenClient;
    private readonly coinbaseClient: CoinbaseClient;
    private readonly binanceClient: BinanceClient;
    private readonly bitrexClient: BitrexClient;
    private readonly geminiClient: GeminiClient;

    constructor(
        private readonly httpService: HttpService,
        private readonly redisService: RedisService,
        @Inject(RatesConfig.KEY) private ratesConfig: ConfigType<typeof RatesConfig>,
        private schedulerRegistry: SchedulerRegistry,
    ) {
        this.pssStorage = new PssClient(httpService, ratesConfig);
        this.cexClient = new CexClient(httpService, cex);
        this.bitfinexClient = new BitfinexClient(httpService, bitfinex);
        this.bitstampClient = new BitstampClient(httpService, bitstamp);
        this.krakenClient = new KrakenClient(httpService, kraken);
        this.coinbaseClient = new CoinbaseClient(httpService, coinbase);
        this.binanceClient = new BinanceClient(httpService, binance);
        this.bitrexClient = new BitrexClient(httpService, bitrex);
        this.geminiClient = new GeminiClient(httpService, gemini);

        const job = new CronJob(ratesConfig.ratesCron, () => this.handleCron());

        schedulerRegistry.addCronJob('rateCron', job);
        job.start();
        this.logger.log('rateCron is started');
    }

    onModuleDestroy() {
        const job: CronJob = this.schedulerRegistry.getCronJob('rateCron');

        job.stop();
        this.logger.log('rateCron is stopped');
    }

    async getRates(symbols?: string[], sources?: string[]) {
        const client: Redis = await this.redisService.getClient();
        if (symbols && sources) {
            const results = [];
            for (let sourceEnumKey in SourceEnum) {
                const keys: string[] = await client.smembers(indexRates);
                const hkeys: { [rate: string]: string[] }[] = await Promise.all(
                    keys.map(async (rate) => {
                        return {
                            [rate]: await client.hkeys(rate), // source:rates:BTC: [marketcap:USD, marketcap:EUR]
                        };
                    }),
                );

                for (let symbol of symbols) {
                    for (let source of sources) {
                        const res = hkeys.find((it) => it[`${sourceEnumKey}:rates:${symbol}`]);
                        if (res) {
                            results.push(
                                res[`${sourceEnumKey}:rates:${symbol}`]
                                    .filter((it) => it.startsWith(source))
                                    .map((it) =>
                                        client.hget(`${sourceEnumKey}:rates:${symbol}`, it),
                                    ),
                            );
                        }
                    }
                }
            }

            const result = await Promise.all(results.flat());
            return result.map((it) => JSON.parse(it));
        } else if (symbols) {
            const hkeysPromises = [];
            for (let sourceEnumKey in SourceEnum) {
                hkeysPromises.push(
                    symbols.map(async (it) => {
                        return {
                            [`${sourceEnumKey}:rates:${it}`]: await client.hkeys(
                                `${sourceEnumKey}:rates:${it}`,
                            ),
                        };
                    }),
                );
            }
            const hkeys: { [rate: string]: string[] }[] = await Promise.all(hkeysPromises.flat());

            const result = await Promise.all(
                hkeys.map(async (it) => {
                    const result = [];
                    for (let [rate, fields] of Object.entries(it)) {
                        await Promise.all(
                            fields.map(async (field) => {
                                const res = await client.hget(rate, field);
                                if (res) {
                                    result.push(JSON.parse(res));
                                }
                            }),
                        );
                    }
                    return result;
                }),
            );
            return result.flat();
        } else if (sources) {
            const results = [];
            for (let sourceEnumKey in SourceEnum) {
                const keys: string[] = await client.smembers(indexRates);
                const hkeys: { [rate: string]: string[] }[] = await Promise.all(
                    keys.map(async (rate) => {
                        return {
                            [rate]: await client.hkeys(rate), // source:rates:BTC: [marketcap:USD, marketcap:EUR]
                        };
                    }),
                );

                for (let source of sources) {
                    hkeys.forEach((hkey) => {
                        for (let [rate, fields] of Object.entries(hkey)) {
                            fields.map((it) => {
                                if (it.startsWith(source)) {
                                    results.push(client.hget(rate, it));
                                }
                            });
                        }
                    });
                }
            }

            const result = await Promise.all(results);
            return result.map((it) => JSON.parse(it));
        } else {
            const results = [];

            for (let sourceEnumKey in SourceEnum) {
                const keys: string[] = await client.smembers(indexRates);

                results.push(keys.map((key) => client.hvals(key))); //todo: pipeline
            }

            const result = await Promise.all(results.flat());
            return result.flat().map((it) => JSON.parse(it));
        }
    }

    async handleCron() {
        try {
            this.logger.debug('cron started');
            const { data: pssData } = await this.pssStorage.fetchRates(); //todo: all awaits to promise.all
            const client: Redis = this.redisService.getClient();
            const rates = await client.smembers(indexRates);
            const pipeline: Pipeline = client.pipeline();
            rates.forEach((rate) => pipeline.del(rate));
            pssData.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.coinmarketcap}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.coinmarketcap}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(this.pssStorage.toResponse(it, SourceEnum.coinmarketcap)),
                    );
            });

            const cexRates = await this.cexClient.fetchRates();
            cexRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.cex}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.cex}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });

            const bitfinexRates = await this.bitfinexClient.fetchRates();
            bitfinexRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.bitfinex}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.bitfinex}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });
            const bitstampRates = await this.bitstampClient.fetchRates();
            bitstampRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.bitstamp}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.bitstamp}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });

            const krakenRates = await this.krakenClient.fetchRates();
            krakenRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.kraken}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.kraken}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });

            const coinbaseRates = await this.coinbaseClient.fetchRates();
            coinbaseRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.coinbase}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.coinbase}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });

            const binanceRates = await this.binanceClient.fetchRates();
            binanceRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.binance}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.binance}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });
            const bitrexRates = await this.bitrexClient.fetchRates();
            bitrexRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.bitrex}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.bitrex}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });
            const geminiRates = await this.geminiClient.fetchRates();
            geminiRates.forEach((it) => {
                pipeline
                    .sadd(indexRates, `${SourceEnum.gemini}:rates:${it.currency}`)
                    .hset(
                        `${SourceEnum.gemini}:rates:${it.currency}`,
                        `${it.source}:${it.rateCurrency}`,
                        JSON.stringify(it),
                    );
            });

            await pipeline.exec();
        } catch (e) {
            this.logger.warn('Error on rates cron job', e);
        }
    }
}
