import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  ParseBoolPipe,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { TripStatus } from '../common/enums/trip-status.enum';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── DASHBOARD ───────────────────────────────────────────────────────────────

  @Get('dashboard/stats')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Estadísticas del dashboard' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('dashboard/activity')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actividad reciente' })
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  // ─── TRIPS ────────────────────────────────────────────────────────────────────

  @Get('trips')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Listar todos los viajes (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TripStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getTrips(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: TripStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getTrips(page, Math.min(limit, 50), status, search);
  }

  // ─── DRIVERS ──────────────────────────────────────────────────────────────────

  @Get('drivers')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Listar conductores (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'available', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getDrivers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('available') available?: string,
    @Query('search') search?: string,
  ) {
    const availableBool =
      available === 'true' ? true : available === 'false' ? false : undefined;
    return this.adminService.getDrivers(page, Math.min(limit, 50), availableBool, search);
  }

  // ─── CLIENTS ──────────────────────────────────────────────────────────────────

  @Get('clients')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Listar clientes (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async getClients(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getClients(page, Math.min(limit, 50), search);
  }

  // ─── PRICING CONFIG ───────────────────────────────────────────────────────────

  @Get('pricing')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Obtener configuración de precios' })
  async getPricingConfig() {
    return this.adminService.getPricingConfig();
  }

  @Patch('pricing/:id')
  @Roles(Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar configuración de precios (SUPERADMIN)' })
  async updatePricingConfig(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: Record<string, any>,
  ) {
    return this.adminService.updatePricingConfig(id, data);
  }
}
