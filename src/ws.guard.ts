import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
// import * as configs from 'config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { AuthGuard } from '@nestjs/passport';
import { IAuthGuard } from '@nestjs/passport/dist/auth.guard';
// import { WsJwtPayload } from './ws-jwt-payload.interface';
import { Server } from 'ws';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs/index';

@Injectable()
export class WsGuard extends AuthGuard('ws-jwt') implements CanActivate {
    private readonly logger: Logger = new Logger(this.constructor.name);
    // constructor(private readonly jwtService: JwtService) { }
    public constructor(private readonly reflector: Reflector) {
        super();
    }

    getRequest(context: ExecutionContext) {
        this.logger.verbose(`getRequest called`);
        const client: any = context.switchToWs().getClient<any>();
        this.logger.verbose(`getRequest headers: ${JSON.stringify(client.request.headers)}`);
        return client.request;
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
        this.logger.debug(`Called canActivate from global WsGuard: isPublic=${isPublic}`);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
}
