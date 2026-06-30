import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthUserDto> {
    const found = await this.authService.validateUser(user.id);

    if (!found) {
      throw new UnauthorizedException();
    }

    return this.authService.toAuthUserDto(found);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(): void {
    // P1: client-only logout — JWT is stateless
  }
}
