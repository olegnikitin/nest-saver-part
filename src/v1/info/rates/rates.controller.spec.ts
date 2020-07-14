import { Test, TestingModule } from '@nestjs/testing';
import { RatesController } from './rates.controller';
import * as assert from 'assert';
import { HttpModule } from '@nestjs/common';
import { RatesService } from './rates.service';
import { Agent } from 'https';
import * as fs from 'fs';

describe.skip('Rates Controller', () => {
    let controller: RatesController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                HttpModule.register({
                    httpsAgent: new Agent({
                        rejectUnauthorized: false,
                        cert: fs.readFileSync(process.env.APP_CONF + '/cert.pem'),
                    }),
                }),
            ],
            controllers: [RatesController],
            providers: [RatesService],
        }).compile();

        controller = module.get<RatesController>(RatesController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all rates', async function() {
        const result = await controller.getRates();
        assert.deepStrictEqual(result.length, 131, 'value from mocked data');
    });

    it('should return filtered rates', async function() {
        const result = await controller.getRates({ currencies: ['USD'], sources: ['coinmarketcap'] });
        assert.deepStrictEqual(result.length, 43, 'value from mocked data');
    });
});
