import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SosService } from './sos.service';
import { TriggerSosDto } from './dto/trigger-sos.dto';
import { SosAlert } from './entities/sos-alert.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@ApiTags('SOS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sos')
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.CLIENT, Role.DRIVER)
  @ApiOperation({ summary: 'Activar alerta SOS (CLIENT o DRIVER)' })
  trigger(
    @Body() dto: TriggerSosDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SosAlert> {
    return this.sosService.trigger(dto.tripId, user.sub, dto.lat, dto.lng);
  }

  @Patch(':id/acknowledge')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Reconocer alerta SOS (SUPERVISOR, SUPERADMIN)' })
  acknowledge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<SosAlert> {
    return this.sosService.acknowledge(id, user.sub);
  }

  @Patch(':id/resolve')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Resolver alerta SOS (SUPERVISOR, SUPERADMIN)' })
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('notes') notes: string | undefined,
    @CurrentUser() user: JwtPayload,
  ): Promise<SosAlert> {
    return this.sosService.resolve(id, user.sub, notes);
  }

  @Get('active')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  @ApiOperation({
    summary: 'Listar alertas SOS activas (SUPERVISOR, SUPERADMIN)',
  })
  getActive(): Promise<SosAlert[]> {
    return this.sosService.getActiveAlerts();
  }
}
