import { IsOptional, IsUppercase } from 'class-validator';
import { ApiResponseProperty } from '@nestjs/swagger';
import { ApiModelPropertyOptional } from '@nestjs/swagger/dist/decorators/api-model-property.decorator';

export enum SourceEnum {
    'coinmarketcap' = 'coinmarketcap',
    'binance' = 'binance',
    'wallet' = 'wallet',
    'cex' = 'cex',
    'bitfinex' = 'bitfinex',
    'bitstamp' = 'bitstamp',
    'kraken' = 'kraken',
    'coinbase' = 'coinbase',
    bitrex = 'bitrex',
    gemini = 'gemini',
}
type Source = keyof typeof SourceEnum;

type RateCurrency = 'USD' | 'EUR' | 'BTC';

export interface Rate {
    id: number;
    currency: string;
    source: Source;
    rateCurrency: RateCurrency;
    rate: number | string;
    updatedAt: string;
}

interface Price {
    "last": string,
    "volume24": string,
    "high": string,
    "low": string,
    "bid": string,
    "ask": string,
    "timestamp": number,
}

export interface ResponseItem {
    source: Source,
    currency: string,
    rateCurrency: RateCurrency,
    price: Price,
}

export class RatesRequestDto {
    @IsOptional()
    @IsUppercase({ each: true })
    @ApiResponseProperty({ example: ['USD', 'EUR', 'BTC'] })
    @ApiModelPropertyOptional({
        type: [String],
    })
    readonly currencies?: RateCurrency[] | string;
    @IsOptional()
    @ApiResponseProperty({ example: ['coinmarketcap', 'binance'] })
    @ApiModelPropertyOptional({
        type: [String],
    })
    readonly sources?: Source[] | string;
}
