import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MedicalService } from './medical.service';
import { UpsertMedicalProfileDto } from './dto/upsert-medical-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Role } from '../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('medical')
export class MedicalController {
  constructor(private readonly medicalService: MedicalService) {}

  /**
   * GET /medical/profile
   * Return own decrypted medical profile (CLIENT only).
   */
  @Get('profile')
  @Roles(Role.CLIENT)
  async getOwnProfile(@CurrentUser() user: JwtPayload) {
    return this.medicalService.findByUserId(user.sub);
  }

  /**
   * PUT /medical/profile
   * Create or update own medical profile (CLIENT only).
   */
  @Put('profile')
  @Roles(Role.CLIENT)
  async upsertProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpsertMedicalProfileDto,
  ) {
    return this.medicalService.upsert(user.sub, dto);
  }

  /**
   * DELETE /medical/profile
   * GDPR right to erasure — delete own profile (CLIENT only).
   */
  @Delete('profile')
  @Roles(Role.CLIENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProfile(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.medicalService.delete(user.sub);
  }

  /**
   * GET /medical/profile/:userId
   * Get a client's medical profile for SOS triage (SUPERVISOR, SUPERADMIN only).
   */
  @Get('profile/:userId')
  @Roles(Role.SUPERVISOR, Role.SUPERADMIN)
  async getProfileForSOS(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.medicalService.findForSOS(userId);
  }
}
