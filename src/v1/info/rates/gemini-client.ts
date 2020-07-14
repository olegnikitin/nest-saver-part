import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface Volume {
    'BTC': string,
    'USD': string,
    'timestamp': number,
}

interface Ticker1 {
    'bid': string,
    'ask': string,
    'volume': Volume,
    'last': string,
}

interface Ticker2 {
    'symbol': string,
    'open': string,
    'high': string,
    'low': string,
    'close': string,
    'changes': string[],
    'bid': string,
    'ask': string,
}

export class GeminiClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly gemini) {
    }

    async fetchRates(): Promise<ResponseItem[]> {
        try {
            const {url, url2, symbol1, symbol2} = this.gemini.pairs[0];

            const request1 = await this.httpService.get(url).toPromise();
            const request2 = await this.httpService.get(url2).toPromise();
            return [this.toResponseStructure(request1.data, request2.data, symbol1, symbol2)];
        } catch (e) {
            this.logger.warn("Error on binance pairs fetch", e);
            return []
        }
    }

    toResponseStructure(ticker1: Ticker1, ticker2: Ticker2, symbol1, symbol2) {
        return {
            source: 'gemini',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last: ticker1.last,
                volume24: ticker1.volume.BTC,
                high: ticker2.high,
                low: ticker2.low,
                bid: ticker2.bid,
                ask: ticker2.ask,
                timestamp: ticker1.volume.timestamp,
            }
        } as ResponseItem
    }
}
