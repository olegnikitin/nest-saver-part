import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface Response {
    "trade-id": number,
    price: string,
    size: string,
    time: string,
    bid: string,
    ask: string,
    volume: string
}

interface StatsResponse {
    open: string,
    high: string,
    low: string,
    volume: string,
    last: string,
    volume_30day: string,
}

export class CoinbaseClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly coinbase) {
    }

    async fetchRates(): Promise<ResponseItem[]> {
        try {
            const requests = this.coinbase.pairs.map(async ({url, stats, symbol1, symbol2}) => {
                return {
                    symbol1, symbol2,
                    response: await this.httpService.get(url).toPromise(),
                    stats: await this.httpService.get(stats).toPromise(),
                }
            });
            const responses = await Promise.all(requests);
            return responses.map(({response, stats, symbol1, symbol2}) => this.toResponseStructure(response.data, stats.data, symbol1, symbol2)).flat();
        } catch (e) {
            this.logger.warn("Error on coinbase pairs fetch", e);
            return []
        }
    }

    toResponseStructure(value: Response, stats: StatsResponse, symbol1, symbol2) {
        const {high, low} = stats;
        return {
            source: 'coinbase',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last: value.price,
                volume24: value.volume,
                high, low,
                bid: value.bid,
                ask: value.ask,
                timestamp: new Date(value.time).getTime(),
            }
        } as ResponseItem
    }
}
