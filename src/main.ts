import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthModule } from './auth/auth.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiModule as V1ApiModule } from './v1/api.module';
import { ApiModule as V2ApiModule } from './v2/api.module';
import { MyLogger } from './logger/logger.service';
import { WsAdapter } from '@nestjs/platform-ws';
import * as swStats from 'swagger-stats';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const SERVER_PORT = process.env.SERVER_PORT || 3000;

function initVersion(app, num: number, ApiModule) {
    const options = new DocumentBuilder()
        .setTitle('API')
        .setDescription('Test app')
        .setVersion(process.env.APP_VERSION || 'local')
        // .addTag(`api/v${num}`)
        .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            description: 'JWT token',
            bearerFormat: 'JWT',
        })
        .build();
    const document = SwaggerModule.createDocument(Object.create(app), options, {
        deepScanRoutes: true,
        include: [AuthModule, ApiModule],
    });
    SwaggerModule.setup(`api/v${num}`, Object.create(app), document);
}

async function bootstrap() {
    const logger = new MyLogger();
    const app = await NestFactory.create(AppModule, {
        logger,
        cors: true,
    });
    // const reflector = app.get(Reflector);
    // app.useGlobalGuards(new JwtAuthGuard(reflector));
    app.useWebSocketAdapter(new WsAdapter(app));
    app.use(swStats.getMiddleware());
    app.useGlobalPipes(
        new ValidationPipe({
            forbidUnknownValues: true,
            forbidNonWhitelisted: true,
            whitelist: true,
            transform: true,
        }),
    );
    // initVersion(app, 1, V1ApiModule.forRoot({ imports: [AppModule] }));
    initVersion(app, 1, V1ApiModule);
    // initVersion(app, 2, V2ApiModule);
    const corsOptions: CorsOptions = {
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
    };
    app.enableCors(corsOptions);
    process.on('SIGTERM', async () => {
        console.info('SIGTERM signal received.');
        console.log('Closing http server.');
        await app.close();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        console.info('SIGINT signal received.');
        console.log('Closing http server.');
        await app.close();
        process.exit(0);
    });
    await app.listen(SERVER_PORT);
}

bootstrap();
