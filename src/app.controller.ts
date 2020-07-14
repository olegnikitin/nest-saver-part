import { Controller, Get, Logger, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller()
export class AppController {
    private readonly logger = new Logger(this.constructor.name);
    constructor() {
        this.logger.setContext('AppController');
        this.logger.error('STARTED test error');
        this.logger.warn('STARTED test warn');
        this.logger.log('STARTED test log');
        this.logger.debug('STARTED test debug');
        this.logger.verbose('STARTED test verbose');
    }

    @Get('/api')
    getIndex(@Res() res) {
        res.status(302).redirect('/api/v1/');
    }
}
