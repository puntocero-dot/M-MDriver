import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DriversService, NearbyDriver } from './drivers.service';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { DriverProfile } from './entities/driver-profile.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Trip } from '../trips/entities/trip.entity';

@ApiTags('Conductores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get('nearby')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Conductores disponibles cercanos (SUPERVISOR, SUPERADMIN)' })
  @ApiQuery({ name: 'lat', type: Number, description: 'Latitud del punto de búsqueda' })
  @ApiQuery({ name: 'lng', type: Number, description: 'Longitud del punto de búsqueda' })
  @ApiQuery({ name: 'radius', type: Number, required: false, description: 'Radio en km (default 10)' })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ): Promise<NearbyDriver[]> {
    return this.driversService.findNearbyAvailable(
      Number(lat),
      Number(lng),
      radius ? Number(radius) : 10,
    );
  }

  @Patch('availability')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Actualizar propia disponibilidad (DRIVER)' })
  updateAvailability(
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DriverProfile> {
    return this.driversService.updateAvailability(user.sub, dto.isAvailable);
  }

  @Get(':id/profile')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Obtener perfil de conductor (SUPERVISOR, SUPERADMIN)' })
  getProfile(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DriverProfile> {
    return this.driversService.getDriverProfile(id);
  }
}

/**
 * Trip assignment is nested under /trips/:tripId/assign to follow REST conventions.
 * This controller is registered separately in DriversModule.
 */
@ApiTags('Conductores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripAssignController {
  constructor(private readonly driversService: DriversService) {}

  @Post(':tripId/assign')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Asignar conductor a viaje (SUPERVISOR, SUPERADMIN)' })
  assignDriver(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Body() dto: AssignDriverDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<Trip> {
    return this.driversService.assignDriverToTrip(tripId, dto.driverId, user.sub);
  }
}
