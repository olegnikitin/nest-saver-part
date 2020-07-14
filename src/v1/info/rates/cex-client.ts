import { HttpService, Logger } from '@nestjs/common';
import { ResponseItem } from './rate';

interface CexTicker {
    timestamp: string,
    low: string,
    high: string,
    last: string,
    volume: string,
    volume30d: string,
    bid: number,
    ask: number,
    priceChange: string,
    priceChangePercentage: string,
    pair: string,
}

export class CexClient {
    private readonly logger: Logger = new Logger(this.constructor.name);

    constructor(private readonly httpService: HttpService, private readonly cexConfig) {
    }

    async fetchRates() {
        try {
            const requests = this.cexConfig.pairs.map(({url}) => this.httpService.get<CexTicker>(url).toPromise());
            const responses = await Promise.all(requests);
            return responses.map(({data}) => this.toResponseStructure(data)).flat();
        } catch (e) {
            this.logger.warn("Error on cex pairs fetch", e);
            return []
        }
    }

    private toResponseStructure(ticker: CexTicker) {
        const {pair, last, volume: volume24, high, low, bid, ask, timestamp} = ticker;
        const [symbol1, symbol2] = pair.split(':');
        return {
            source: 'cex',
            currency: symbol1,
            rateCurrency: symbol2,
            price: {
                last, volume24, high, low,
                bid: String(bid),
                ask: String(ask),
                timestamp: parseInt(timestamp)
            }
        } as ResponseItem
    }
}