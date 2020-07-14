import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ApiModule as V1ApiModule } from './v1/api.module';
import { ApiModule as V2ApiModule } from './v2/api.module';
import { HealthCheck, TerminusModule } from '@nestjs/terminus';
import { ConfigModule } from '@nestjs/config';
import { NotificationCenterModule } from './notification-center/notification-center.module';
import { HealthController } from './health-check/health.controller';
import { AppController } from './app.controller';

@Module({
    imports: [
        TerminusModule,
        ConfigModule.forRoot({
            ignoreEnvFile: false,
            isGlobal: true,
            envFilePath: [process.env.APP_CONF + '/config.env', '.local.env'],
        }),
        AuthModule,
        V1ApiModule,
        // V2ApiModule,
        NotificationCenterModule,
    ],
    controllers: [HealthController, AppController],
    // providers: [AppService],
    exports: [],
})
export class AppModule {}
