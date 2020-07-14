import { Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiController } from '../../api.controller';
import { Public } from '../../../public.decorator';
import { Rate, RatesRequestDto } from './rate';
import { RatesService } from './rates.service';

type Data = string | string[];

const toArray = (val: Data) => {
    if (val) {
        if (Array.isArray(val)) return val;
        else return [val];
    }
    return null;
};

@ApiTags('Public')
export class RatesController extends ApiController {
    constructor(private readonly ratesService: RatesService) {
        super();
    }

    @Get('info/rates')
    @Public()
    @ApiOperation({ summary: 'Get rates' })
    async getRates(@Query() dto?: RatesRequestDto): Promise<Rate[]> {
        return await this.ratesService.getRates(toArray(dto?.currencies), toArray(dto.sources));
    }
}
