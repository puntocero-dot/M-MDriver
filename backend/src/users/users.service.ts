import {
  Injectable,
  NotFoundException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { Role } from '../common/enums/role.enum';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.ensureSuperAdmin();
  }

  private async ensureSuperAdmin() {
    // --- SuperAdmin ---
    const superEmail = 'superadmin@mmdrivers.com';
    const existingSuper = await this.findByEmail(superEmail);

    if (existingSuper) {
      this.logger.log('SuperAdmin ya existe');
    } else {
      this.logger.log('Creando SuperAdmin inicial...');
      const passwordHash = await bcrypt.hash('Diego1989r$', BCRYPT_ROUNDS);
      
      const superAdmin = this.usersRepository.create({
        email: superEmail,
        phone: '00000000',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.SUPERADMIN,
        isVerified: true,
      });

      await this.usersRepository.save(superAdmin);
      this.logger.log('SuperAdmin creado exitosamente');
    }

    // --- Admin operativo ---
    const adminEmail = 'admin@mmdrivers.com';
    const existingAdmin = await this.findByEmail(adminEmail);

    if (existingAdmin) {
      this.logger.log('Admin operativo ya existe');
    } else {
      this.logger.log('Creando Admin operativo...');
      const passwordHash = await bcrypt.hash('Admin123', BCRYPT_ROUNDS);
      
      const admin = this.usersRepository.create({
        email: adminEmail,
        phone: '00000001',
        passwordHash,
        firstName: 'Admin',
        lastName: 'M&M',
        role: Role.SUPERADMIN,
        isVerified: true,
      });

      await this.usersRepository.save(admin);
      this.logger.log('Admin operativo creado exitosamente');
    }
  }

  async create(dto: RegisterDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existing) {
      if (existing.email === dto.email) {
        throw new ConflictException('El email ya está registrado');
      }
      throw new ConflictException('El teléfono ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = this.usersRepository.create({
      email: dto.email.toLowerCase().trim(),
      phone: dto.phone,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: dto.role ?? Role.CLIENT,
    });

    return this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async findAll(page = 1, limit = 20): Promise<[User[], number]> {
    return this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    user.isActive = false;
    await this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }
}
