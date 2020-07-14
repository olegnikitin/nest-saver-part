import {
    BaseWsExceptionFilter,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { Logger, UseFilters, UseGuards } from '@nestjs/common';
import { WsGuard } from '../ws.guard';
import { Server } from 'ws';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseExceptionFilter } from '@nestjs/core';
import { WsExceptionFilter } from '../ws-exception.filter';
import { Public } from '../public.decorator';

@UseGuards(WsGuard)
@WebSocketGateway({
    path: '/ws',
    origins: '*:*',
    transports: ['websocket'],
})
@UseFilters(WsExceptionFilter)
export class WsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger: Logger = new Logger(this.constructor.name);

    @WebSocketServer()
    server: Server;

    public async handleConnection(client: any, data: any) {
        this.logger.warn(`handleConnection entry point.`);
        this.logger.warn(`Auth header is: ${data.headers.authorization}`);
    }

    handleDisconnect(client: any): any {
        this.logger.warn(`handleDisconnect entry point.`);
    }

    @SubscribeMessage('message')
    onMessage(@ConnectedSocket() client: any, @MessageBody() payload: any) {
        this.logger.debug(`GOT message: ${JSON.stringify(payload)}`);
        return { event: 'message2', data: payload };
    }

    @SubscribeMessage('message2')
    @Public()
    onMessage2(@ConnectedSocket() client: any, @MessageBody() data: any): Observable<WsResponse<number>> {
        this.logger.debug(`GOT message2: ${JSON.stringify(data)}`);
        // return from([1, 2, 3]).pipe(map(item => ({ event: 'events', data: item })));
        return from([1, 2, 3]).pipe(map((item) => ({ event: 'message2', data: item })));
    }

    async afterInit(server: Server) {
        this.logger.verbose(`afterInit`);
        server.on('connection', (socket, request) => {
            socket['request'] = reuest;
        });
    }
}
