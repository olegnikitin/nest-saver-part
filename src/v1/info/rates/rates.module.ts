import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import RatesConfig from './rates.config';
import { Agent } from 'https';
import * as fs from 'fs';
import { RedisModule } from 'nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { RatesController } from './rates.controller';
import { RatesService } from './rates.service';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [RatesConfig],
        }),
        HttpModule.registerAsync({
            imports: [ConfigModule.forRoot({ load: [RatesConfig] })],
            useFactory: async (ratesConfig: ConfigType<typeof RatesConfig>) => ({
                httpsAgent: new Agent({
                    rejectUnauthorized: false,
                    cert: fs.readFileSync(ratesConfig.apiCertFile),
                }),
            }),
            inject: [RatesConfig.KEY],
        }),
        RedisModule.forRootAsync({
            imports: [ConfigModule.forRoot({ load: [RatesConfig] })],
            useFactory: async (ratesConfig: ConfigType<typeof RatesConfig>) => ({ url: ratesConfig.redis_url }),
            inject: [RatesConfig.KEY],
        }),
        ScheduleModule.forRoot(),
    ],
    controllers: [RatesController],
    providers: [RatesService],
    exports: [],
})
export class InfoRatesModule {}
