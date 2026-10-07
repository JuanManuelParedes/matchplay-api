import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MatchesModule } from '../matches/matches.module';
import { ChatsModule } from '../chats/chats.module';
import { PerfilesController } from './perfiles.controller';
import { PerfilesService } from './perfiles.service';

@Module({
  // Perfiles -> Chats -> Eventos es una sola dirección (sin ciclos):
  // al formarse un match, PerfilesService crea el chat correspondiente.
  imports: [AuthModule, MatchesModule, ChatsModule],
  controllers: [PerfilesController],
  providers: [PerfilesService],
})
export class PerfilesModule {}
