import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
    private readonly logger = new Logger(this.constructor.name);
    public constructor(private readonly reflector: Reflector) {
        super();
    }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
        this.logger.debug(`Called canActivate from global AuthGuard: isPublic=${isPublic}`);
        if (isPublic) {
            return true;
        }
        return super.canActivate(context);
    }
    handleRequest(err, user, info) {
        this.logger.verbose(
            `handleRequest info=${JSON.stringify(info)} err=${JSON.stringify(err)} user=${JSON.stringify(
                user,
            )}`,
        );
        if (err || !user) {
            this.logger.debug(
                `Rejected token: info=${JSON.stringify(info)} err=${JSON.stringify(err)} user=${JSON.stringify(
                    user,
                )}`,
            );
            throw err || new UnauthorizedException(info.message); // Detailed info
        }
        this.logger.verbose(`Returning user=${JSON.stringify(user)}`);
        return user;
    }
}
