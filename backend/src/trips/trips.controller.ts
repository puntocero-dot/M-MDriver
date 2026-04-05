import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { TripStatus } from '../common/enums/trip-status.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Trip } from './entities/trip.entity';

@ApiTags('Viajes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Crear nuevo viaje (CLIENT)' })
  create(
    @Body() dto: CreateTripDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Trip> {
    return this.tripsService.create(dto, user);
  }

  @Get('my')
  @Roles(Role.CLIENT)
  @ApiOperation({ summary: 'Mis viajes (CLIENT)' })
  myTrips(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<[Trip[], number]> {
    return this.tripsService.findByClientId(user.sub, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener viaje por ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Trip> {
    return this.tripsService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Actualizar estado del viaje' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: TripStatus,
    @CurrentUser() user: JwtPayload,
  ): Promise<Trip> {
    return this.tripsService.updateStatus(id, status, user);
  }

  @Post(':id/share')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar token para compartir viaje en vivo (CLIENT)',
  })
  async generateShare(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ shareToken: string }> {
    const token = await this.tripsService.generateShareToken(id, user.sub);
    return { shareToken: token };
  }
}
