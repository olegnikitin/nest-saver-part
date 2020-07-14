import { Test, TestingModule } from '@nestjs/testing';
import { RatesService } from './rates.service';
import * as assert from 'assert';
import { HttpService } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';

jest.mock('nestjs-redis');

// @ts-ignore
import { mockRates } from './rates.json';

describe.skip('RatesService', () => {
    let service: RatesService;
    let redisService: RedisService = new RedisService({ clients: undefined, defaultKey: '', size: 0 });
    let httpService: HttpService = new HttpService();

    beforeEach(async () => {
        service = new RatesService(httpService, redisService, null, null);
        //todo: cleanMock
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should return values by all types', async function() {
        // jest.spyOn(service, "getRates").mockImplementation(async () => []);
        // @ts-ignore
        jest.spyOn(httpService, 'get').mockImplementation(async () => ({ toPromise: { mockRates } }));

        const response = await service.getRates(['ATOM']);
        assert.ok(Array.isArray(response));
        assert.deepStrictEqual(response.length, 131, 'value from mocked data');
    });
    it('should return valid values by symbols', async function() {
        const response = await service.getRates(['ATOM']);
        assert.ok(Array.isArray(response));
        assert.deepStrictEqual(response.length, 131, 'value from mocked data');
    });
    it('should return valid values by sources', async function() {
        const response = await service.getRates(null, ['coinmarketcap']);
        assert.ok(Array.isArray(response));
        assert.deepStrictEqual(response.length, 131, 'value from mocked data');
    });
    it('should return valid values', async function() {
        const response = await service.getRates();
        assert.ok(Array.isArray(response));
        assert.deepStrictEqual(response.length, 131, 'value from mocked data');
    });
});
