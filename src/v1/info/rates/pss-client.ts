import { HttpService } from '@nestjs/common';
import { Rate, ResponseItem } from './rate';
import { ConfigType } from '@nestjs/config';
import RatesConfig from './rates.config';

export class PssClient {
    constructor(
        private readonly httpService: HttpService,
        private ratesConfig: ConfigType<typeof RatesConfig>,
    ) {}

    fetchRates() {
        const { authorizationHeader: Authorization, pssClientUrl } = this.ratesConfig;
        return this.httpService
            .get<Rate[]>(`${pssClientUrl}/finances/rates`, { headers: { Authorization } })
            .toPromise();
    }

    toResponse(rate: Rate, source: string) {
        const { currency, rateCurrency, updatedAt, rate: last } = rate;
        return {
            source, currency, rateCurrency,
            price: {
                last,
                volume24: null,
                high: null,
                low: null,
                bid: null,
                ask: null,
                timestamp: new Date(updatedAt).getTime(),
            },
        } as ResponseItem;
    };
}
