import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DeportesModule } from './deportes/deportes.module';
import { PerfilesModule } from './perfiles/perfiles.module';
import { MatchesModule } from './matches/matches.module';
import { EventosModule } from './eventos/eventos.module';
import { ChatsModule } from './chats/chats.module';
import { CuentaModule } from './cuenta/cuenta.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    DeportesModule,
    PerfilesModule,
    MatchesModule,
    EventosModule,
    ChatsModule,
    CuentaModule,
  ],
})
export class AppModule {}
