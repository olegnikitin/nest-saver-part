require('dotenv').config({ path: `${process.env.APP_CONF}/config.env` });
require('dotenv').config({ path: '.local.env' });
const isTsNode = (process.env._ || '').includes('ts-node');
const srcPreffix = isTsNode ? 'src' : 'dist';
const SnakeNamingStrategy = require('typeorm-naming-strategies').SnakeNamingStrategy;
const typeOrmConfig = {
    type: 'postgres',
    url: process.env.POSTGRES_URL,
    ssl: !!process.env.POSTGRES_SSL,
    synchronize: false,
    logging: true,
    keepConnectionAlive: false,
    entities: [`${srcPreffix}/**/*.entity{.ts,.js}`],
    migrations: [`${srcPreffix}/migrations/*{.ts,.js}`],
    cli: {
        migrationsDir: 'src/migrations',
    },
    maxQueryExecutionTime: 1000,
    namingStrategy: new SnakeNamingStrategy(),
};
module.exports = typeOrmConfig;
