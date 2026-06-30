export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponseDto {
  accessToken: string;
  user: AuthUserDto;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}
