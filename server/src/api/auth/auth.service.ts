import {
  IEmailJob,
  ISendOTPEmailJob,
  IVerifyEmailJob,
} from '@/common/interfaces/job.interface';
import { Branded } from '@/common/types/types';
import { AllConfigType } from '@/config/config.type';
import { JobName, QueueName } from '@/constants/job.constant';
import { InjectQueue } from '@nestjs/bullmq';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import crypto from 'crypto';
import ms from 'ms';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { JwtPayloadType } from './types/jwt-payload.type';
import { RegisterReqDto } from './dto/register.req.dto';
import { RegisterResDto } from './dto/register.res.dto';
import { ValidationException } from '@/exceptions/validation.exception';
import { ErrorCode } from '@/constants/error-code.constant';
import { SYSTEM_USER_ID } from '@/constants/app.constant';
import { plainToInstance } from 'class-transformer';
import { CacheKey } from '@/constants/cache.constant';
import { createCacheKey } from '@/utils/cache.util';
import { AuthProviderEntity } from '../user/entities/auth-provider.entity';
import { AuthProviderType, Role } from '@/constants/entity.enum';
import { LoginReqDto } from './dto/login.req.dto';
import { LoginResDto } from './dto/login.res.dto';
import { verifyPassword } from '@/utils/password.util';
import { SessionEntity } from '../user/entities/session.entity';
import { RoleEntity } from '../user/entities/role.entity';
import { Uuid } from '@/common/types/common.type';
import { LoginWithGoogleReqDto } from './dto/login-google.req.dto';
import { ChangePasswordReqDto } from './dto/change-password.req.dto';
import { VerifyForgotPasswordReqDto } from './dto/verify-fogot-password.req.dto copy';
import { RefreshReqDto } from './dto/refresh.req.dto';
import { RefreshResDto } from './dto/refresh.res.dto';
import { JwtRefreshPayloadType } from './types/jwt-refresh-payload.type';
import { RedisService } from '@/redis/redis.service';

type Token = Branded<
  {
    accessToken: string;
    refreshToken: string;
    tokenExpires: number;
  },
  'token'
>;

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService<AllConfigType>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService, 
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    @InjectRepository(AuthProviderEntity)
    private readonly authProviderRepository: Repository<AuthProviderEntity>,
    @InjectQueue(QueueName.EMAIL)
    private readonly emailQueue: Queue<IEmailJob, any, string>,
  ) {}

  async signIn(dto: LoginReqDto): Promise<LoginResDto> {
    const { email, password } = dto;
    const account = await this.authProviderRepository.findOne({
      where: { email, providerType: AuthProviderType.EMAIL_PASSWORD },
      select: ['id', 'password'],
    });

    const isPasswordValid =
      account && (await verifyPassword(password, account.password));

    if (!account || !isPasswordValid) {
      throw new UnauthorizedException();
    }

    return this.returnTokenAfterLoginSuccess(account.id);
  }

  async signInWithGoogle(dto: LoginWithGoogleReqDto): Promise<LoginResDto> {
    const { email, providerId, firstName, lastName, imageUrl } = dto;
    if (!providerId) {
      throw new UnauthorizedException();
    }

    //check auth_provider is exists
    let account = await this.authProviderRepository.findOne({
      where: {
        providerType: AuthProviderType.GOOGLE,
        providerId: providerId,
      },
    });

    //if account doesn't exists, create new account and user
    if (!account) {
      const role_user = await this.roleRepository.findOneBy({
        rolename: Role.USER,
      });
      account = new AuthProviderEntity({
        providerType: AuthProviderType.GOOGLE,
        email: email,
        providerId: providerId,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      await account.save();

      const newUser = new UserEntity({
        username: lastName + ' ' + firstName,
        avatarUrl: imageUrl,
        isVerify: true,
        roles: [role_user],
        email: email,
        authProviderId: account.id,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      await newUser.save();
    }

    return this.returnTokenAfterLoginSuccess(account.id);
  }

  async register(dto: RegisterReqDto): Promise<RegisterResDto> {
    //check cache require register accept in 60s
    const registered = await this.redisService.get(dto.email);
    if (registered === 'register') {
      throw new BadRequestException();
    }

    // Check if the email already exists
    let account = await this.authProviderRepository.findOneBy({
      email: dto.email,
      providerType: AuthProviderType.EMAIL_PASSWORD,
    });
    let user: UserEntity;

    if (account) {
      // email is exists
      //check user is verify
      user = await this.userRepository.findOneByOrFail({
        authProviderId: account.id,
      });
      if (user.isVerify) {
        throw new UnauthorizedException();
      }

      //change password
      account.password = dto.password;
      await this.authProviderRepository.save(account);
    } else {
      // email is not exists
      account = new AuthProviderEntity({
        email: dto.email,
        providerType: AuthProviderType.EMAIL_PASSWORD,
        password: dto.password,
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
      });
      await this.authProviderRepository.save(account);

      const userRole = await this.roleRepository.findOne({
        where: { rolename: Role.USER },
      });
      user = new UserEntity({
        createdBy: SYSTEM_USER_ID,
        updatedBy: SYSTEM_USER_ID,
        authProviderId: account.id,
        email: dto.email,
        roles: [userRole],
      });
      await this.userRepository.save(user);
    }

    // Send email verification
    const token = await this.createVerificationToken({ id: user.id });
    const tokenExpiresIn = this.configService.getOrThrow(
      'auth.confirmEmailExpires',
      {
        infer: true,
      },
    );
    await this.redisService.set(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, user.id),
      token,
      ms(tokenExpiresIn),
    );
    await this.redisService.set(dto.email, 'register', 60000);

    await this.emailQueue.add(
      JobName.EMAIL_VERIFICATION,
      {
        email: dto.email,
        token,
      } as IVerifyEmailJob,
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );

    return plainToInstance(RegisterResDto, {
      accountId: account.id,
    });
  }

  async logout(userToken: JwtPayloadType): Promise<void> {
    // Tính TTL
    const expirationTimeInMs = userToken.exp * 1000; // Chuyển exp từ giây sang milliseconds
    const currentTimeInMs = Date.now(); // Thời gian hiện tại (milliseconds)
    const ttlInMs = expirationTimeInMs - currentTimeInMs; // Thời gian còn lại (milliseconds)
    
    // Đảm bảo TTL không âm và chuyển sang giây
    const ttlInSeconds = Math.max(0, Math.floor(ttlInMs / 1000)); // Chuyển sang giây, không âm
  
    // Lưu vào Redis với TTL
    await this.redisService.set(
      createCacheKey(CacheKey.SESSION_BLACKLIST, userToken.sessionId),
      "true", // Giá trị là chuỗi
      ttlInSeconds, // TTL tính bằng giây
    );
  
    // Xóa phiên từ cơ sở dữ liệu
    await SessionEntity.delete(userToken.sessionId);
  }

  async refreshToken(dto: RefreshReqDto): Promise<RefreshResDto> {
    const { sessionId, hash } = this.verifyRefreshToken(dto.refreshToken);
    const session = await SessionEntity.findOneBy({ id: sessionId });

    if (!session || session.hash !== hash) {
      throw new UnauthorizedException();
    }

    const user = await this.userRepository.findOneOrFail({
      where: { id: session.userId },
      select: ['id'],
      relations: ['roles'],
    });

    const newHash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    SessionEntity.update(session.id, { hash: newHash });

    return await this.createToken({
      roles: user.roles.map((role) => role.rolename),
      id: user.id,
      sessionId: session.id,
      hash: newHash,
    });
  }

  async verifyAccessToken(token: string): Promise<JwtPayloadType> {

    if (!token) {
      return
    }
    
    let payload: JwtPayloadType;
    // Xác minh token
    
    try {      
      payload = this.jwtService.verify(token.trim(), {
        secret: 'secret'
      }); 
    } catch(error) {
      console.error('Lỗi khi xác minh token:', error);
      throw new UnauthorizedException('Token không hợp lệ');
    }

   // Kiểm tra xem phiên có trong blacklist không
  try {
    const blacklistedValue = await this.redisService.get(
      createCacheKey(CacheKey.SESSION_BLACKLIST, payload.sessionId),
    );

    // Chuyển đổi giá trị từ Redis sang boolean
    const isSessionBlacklisted = blacklistedValue === 'true';

    if (isSessionBlacklisted) {
      throw new UnauthorizedException('Phiên đã bị đăng xuất');
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra blacklist trong Redis:', error);
    throw new UnauthorizedException('Không thể xác minh phiên');
  }

  return payload;
  }

  async verifyEmail(token: string): Promise<any> {
    const { id } = await this.verifyEmailToken(token);

    const tokenCache = await this.redisService.get(
      createCacheKey(CacheKey.EMAIL_VERIFICATION, id),
    );

    if (token !== tokenCache) {
      throw new UnauthorizedException();
    }
    const user = await this.userRepository.findOneByOrFail({ id: id as Uuid });
    user.isVerify = true;
    await user.save();
    return { message: 'ok' };
  }

  async forgotPassword(email: string) {
    await this.authProviderRepository.findOneByOrFail({
      email: email,
      providerType: AuthProviderType.EMAIL_PASSWORD,
    });
    //generate OTP
    const otp = this.gennerateOTP();
    //send otp
    await this.emailQueue.add(
      JobName.EMAIL_SEND_OTP_FORGOT_PASSWORD,
      {
        email: email,
        otp,
      } as ISendOTPEmailJob,
      { attempts: 3, backoff: { type: 'exponential', delay: 60000 } },
    );
    //cache otp & account
    await this.redisService.set(
      createCacheKey(CacheKey.PASSWORD_RESET, email),
      otp,
      3 * 60 * 1000,
    );
  }

  async verifyForgotPassword(dto: VerifyForgotPasswordReqDto) {
    const account = await this.authProviderRepository.findOneByOrFail({
      email: dto.email,
    });
    const otpCache = await this.redisService.get(
      createCacheKey(CacheKey.PASSWORD_RESET, dto.email),
    );
    if (!otpCache || otpCache !== dto.otp) {
      throw new Error();
    }
    account.password = dto.password;
    await this.authProviderRepository.save(account);
    await this.redisService.del(
      createCacheKey(CacheKey.PASSWORD_RESET, dto.email),
    );
    return;
  }

  async changePassword(id: Uuid, dto: ChangePasswordReqDto): Promise<void> {
    const user = await this.userRepository.findOneByOrFail({ id });
    const account = await this.authProviderRepository.findOneByOrFail({
      id: user.authProviderId,
    });
    const validPassword = await verifyPassword(
      dto.oldPassword,
      account.password,
    );
    if (!validPassword) {
      throw new ValidationException(ErrorCode.ACC_E004);
    }
    account.password = dto.newPassword;
    await this.authProviderRepository.save(account);
    return;
  }

  private async returnTokenAfterLoginSuccess(
    providerId: Uuid,
  ): Promise<LoginResDto> {
    const user = await this.userRepository.findOne({
      where: { authProviderId: providerId },
      relations:['roles']
    });
    if (!user.isActive || !user.isVerify) {
      throw new UnauthorizedException();
    }
    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = new SessionEntity({
      hash,
      userId: user.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID,
    });
    await session.save();

    const token = await this.createToken({
      id: user.id,
      roles: user.roles.map((role) => role.rolename),
      sessionId: session.id,
      hash,
    });

    
    return plainToInstance(LoginResDto, {
      userId: user.id,
      ...token,
    });
  }

  private verifyRefreshToken(token: string): JwtRefreshPayloadType {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.getOrThrow('auth.refreshSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async verifyEmailToken(token: string): Promise<JwtPayloadType> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
      });
    } catch {
      throw new UnauthorizedException();
    }
  }

  private async createVerificationToken(data: { id: string }): Promise<string> {
    
    return await this.jwtService.signAsync(
      {
        id: data.id,
      },
      {
        secret: this.configService.getOrThrow('auth.confirmEmailSecret', {
          infer: true,
        }),
        expiresIn: this.configService.getOrThrow('auth.confirmEmailExpires', {
          infer: true,
        }),
      },
    );
  }

  private async createToken(data: {
    id: string;
    roles: string[];
    sessionId: string;
    hash: string;
  }): Promise<Token> {
    
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });
    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [accessToken, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          roles: data.roles,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);
    
    return {
      accessToken,
      refreshToken,
      tokenExpires,
    } as Token;
  }

  private gennerateOTP(): string {
    const otp = Math.floor(Math.random() * 1000000) + 1000000;
    return otp.toString().slice(1);
  }
}
