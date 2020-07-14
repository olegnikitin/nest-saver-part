import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { InfoRatesModule } from './info/rates/rates.module';
import { AccountsModule } from './accounts/accounts.module';
import { StakingModule } from './staking/staking.module';
import { TransactionsModule } from './transactions/transactions.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProfileModule } from './profile/profile.module';

@Module({
    imports: [ProfileModule, AccountsModule, TransactionsModule, InfoRatesModule, StakingModule, NotificationsModule],
    providers: [WsGateway],
})
export class ApiModule {}
