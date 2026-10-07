import { Module } from '@nestjs/common';
import { DeportesController } from './deportes.controller';
import { DeportesService } from './deportes.service';

@Module({
  controllers: [DeportesController],
  providers: [DeportesService],
  exports: [DeportesService],
})
export class DeportesModule {}
