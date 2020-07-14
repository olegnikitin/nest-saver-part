import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface Data {
    'a': string[],
    'b': string[],
    'c': string[],
    'v': string[],
    'p': string[],
    't': number[],
    'l': string[],
    'h': string[],
    'o': string,
}

interface Response {
    error: [],
    result: {
        XXBTZUSD: Data,
        XXBTZEUR: Data
    }
}

export class KrakenClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly kraken) {
    }

    async fetchRates(): Promise<ResponseItem[]> {
        try {
            const {url} = this.kraken.pairs[0];
            const {data} = await this.httpService.get(url).toPromise();
            return [
                this.toResponseStructure(data.result.XXBTZUSD, 'BTC', 'USD'),
                this.toResponseStructure(data.result.XXBTZEUR, 'BTC', 'EUR')
            ]
        } catch (e) {
            this.logger.warn(`Error on kraken fetch`, e);
            return []
        }
    }

    toResponseStructure(value: Data, symbol1, symbol2) {
        return {
            source: 'kraken',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last: value.c[0],
                volume24: value.v[1],
                high: value.h[1],
                low: value.l[1],
                bid: value.b[0],
                ask: value.a[0],
                timestamp: Date.now(),
            }
        } as ResponseItem
    }
}
