import {
    ExceptionFilter,
    Catch,
    HttpException,
    ArgumentsHost,
    HttpStatus,
    Logger,
} from '@nestjs/common';

function parseStackMessage(stackMessage) {
    try {
        return stackMessage.split('\n')[1].trim();
    } catch (e) {
        return '';
    }
}

@Catch()
export class ErrorFilter implements ExceptionFilter {
    private readonly logger: Logger = new Logger(this.constructor.name);
    catch(error: Error, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse();
        const status =
            error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        this.logger.verbose(
            `Catched error on ${request.url}: message=${
                error.message
            }, status=${status}, stack=${parseStackMessage(error.stack)}`,
        );

        if (error instanceof HttpException && status !== HttpStatus.INTERNAL_SERVER_ERROR) {
            return response.status(status).json({ error: error.message });
        }
        this.logger.error(
            `UNKNOWN ERROR on ${request.url}: message=${
                error.message
            }, status=${status}, stack=${parseStackMessage(error.stack)}`,
        );
        return response.status(status).json({ error: 'internal_server_error' });
    }
}
