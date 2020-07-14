import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface Result {
    'MarketName': 'USD-BTC',
    'High': number,
    'Low': number,
    'Volume': number,
    'Last': number,
    'BaseVolume': number,
    'TimeStamp': string,
    'Bid': number,
    'Ask': number,
    'OpenBuyOrders': number,
    'OpenSellOrders': number,
    'PrevDay': number,
    'Created': string,
}

export class BitrexClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly bitrex) {
    }

    async fetchRates(): Promise<ResponseItem[]> {
        try {
            const {url, symbol1, symbol2} = this.bitrex.pairs[0];
            const {data} = await this.httpService.get(url).toPromise();
            return [this.toResponseStructure(data.result[0], symbol1, symbol2)];
        } catch (e) {
            this.logger.warn("Error on binance pairs fetch", e);
            return []
        }
    }

    toResponseStructure(value: Result, symbol1, symbol2) {
        return {
            source: 'bitrex',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last: String(value.Last),
                volume24: String(value.Volume),
                high: String(value.High),
                low: String(value.Low),
                bid: String(value.Bid),
                ask: String(value.Ask),
                timestamp: new Date(value.TimeStamp).getTime(),
            }
        } as ResponseItem
    }
}
