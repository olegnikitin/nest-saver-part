import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface Response {
    'symbol': string,
    'priceChange': string,
    'priceChangePercent': string,
    'weightedAvgPrice': string,
    'prevClosePrice': string,
    'lastPrice': string,
    'lastQty': string,
    'bidPrice': string,
    'bidQty': string,
    'askPrice': string,
    'askQty': string,
    'openPrice': string,
    'highPrice': string,
    'lowPrice': string,
    'volume': string,
    'quoteVolume': string,
    'openTime': number,
    'closeTime': number,
    'firstId': number,
    'lastId': number,
    'count': number,
}

export class BinanceClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly binance) {
    }

    async fetchRates(): Promise<ResponseItem[]> {
        try {
            const requests = this.binance.pairs.map(async ({url, symbol1, symbol2}) => {
                return {
                    symbol1, symbol2,
                    response: await this.httpService.get(url).toPromise()
                }
            });
            const responses = await Promise.all(requests);
            return responses.map(({response, symbol1, symbol2}) => this.toResponseStructure(response.data, symbol1, symbol2)).flat();
        } catch (e) {
            this.logger.warn("Error on binance pairs fetch", e);
            return []
        }
    }

    toResponseStructure(value: Response, symbol1, symbol2) {
        return {
            source: 'binance',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last: value.lastPrice,
                volume24: value.volume,
                high: value.highPrice,
                low: value.lowPrice,
                bid: value.bidPrice,
                ask: value.askPrice,
                timestamp: Date.now(),
            }
        } as ResponseItem
    }
}
