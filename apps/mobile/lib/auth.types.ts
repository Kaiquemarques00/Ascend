export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
}

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface UpdateProfileParams {
  name: string;
}
