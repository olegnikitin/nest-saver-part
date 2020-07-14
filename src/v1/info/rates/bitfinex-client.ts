import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface Response {
    mid, bid, ask, last_price, low, high, volume, timestamp
}

export class BitfinexClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly bitfinex) {
    }

    async fetchRates() {
        try {
            const requests = this.bitfinex.pairs.map(async ({url, symbol1, symbol2}) => {
                return {
                    symbol1, symbol2,
                    response: await this.httpService.get(url).toPromise(),
                }
            });
            const responses = await Promise.all(requests);
            return responses.map(({response, symbol1, symbol2}) => this.toResponseStructure(response.data, symbol1, symbol2)).flat();
        } catch (e) {
            this.logger.warn("Error on bitfinex pairs fetch", e);
            return []
        }
    }

    toResponseStructure(value: Response, symbol1, symbol2) {
        const {last_price: last, volume: volume24, high, low, bid, ask, timestamp, } = value;
        return {
            source: 'bitfinex',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last, volume24, high, low, bid, ask, timestamp,
            }
        } as ResponseItem
    }
}
