import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeospatialGateway } from './geospatial.gateway';
import { GeospatialService } from './geospatial.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('jwt.secret'),
      }),
    }),
  ],
  providers: [GeospatialGateway, GeospatialService],
  exports: [GeospatialGateway, GeospatialService],
})
export class GeospatialModule {}
