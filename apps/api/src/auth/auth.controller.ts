import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthResponseDto, AuthUserDto, AuthenticatedUser } from './auth.types';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: unknown): Promise<AuthResponseDto> {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  login(@Body() body: unknown): Promise<AuthResponseDto> {
    return this.authService.login(body);
  }

  @Public()
  @Post('google')
  loginWithGoogle(@Body() body: unknown): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(body);
  }

  @Public()
  @Post('refresh')
  refresh(@Body() body: unknown): Promise<AuthResponseDto> {
    return this.authService.refresh(body);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    const found = await this.authService.validateUser(user.id);

    if (!found) {
      throw new UnauthorizedException();
    }

    return this.authService.toAuthUserDto(found);
  }

  @Patch('me')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: unknown,
  ): Promise<AuthUserDto> {
    return this.authService.updateProfile(user.id, body);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Body() body: unknown): Promise<void> {
    return this.authService.logout(body);
  }
}
