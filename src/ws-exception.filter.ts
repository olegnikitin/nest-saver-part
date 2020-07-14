import { ArgumentsHost, Catch, ExceptionFilter, Logger, UnauthorizedException } from '@nestjs/common';

@Catch(UnauthorizedException)
export class WsExceptionFilter<UnauthorizedException> implements ExceptionFilter {
    private readonly logger: Logger = new Logger(this.constructor.name);

    catch(exception: UnauthorizedException, host: ArgumentsHost) {
        this.logger.warn(`${exception}`);
        const client = host.switchToWs().getClient();
        this.handleError(client, exception);
    }

    handleError(client, exception: UnauthorizedException) {
        // client.send(exception.toString()); // 'Error: {"statusCode":401,"error":"Unauthorized"}'
        client.close();
    }
}
