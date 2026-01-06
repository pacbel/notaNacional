export interface LoginRequest {
  email: string;
  senha: string;
}

export interface MfaChallengeResponse {
  email: string;
  codigoEnviado: boolean;
  expiraEm: string;
  mensagem: string;
}

export interface ConfirmMfaRequest {
  email: string;
  codigo: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiraEm: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  novaSenha: string;
}

export interface RobotAuthRequest {
  clientId: string;
  clientSecret: string;
  scopes: string[];
}

export type RoleName = "Administrador" | "Gestao" | "Operacao" | "Robot";

export interface DecodedUserToken {
  sub?: string;
  name?: string;
  email?: string;
  role?: RoleName | RoleName[];
  roles?: RoleName[];
  prestadorId?: string;
  [claim: string]: unknown;
}

export interface AuthenticatedUser {
  id: string;
  nome?: string;
  email?: string;
  roles: RoleName[];
  prestadorId?: string | null;
}
