export interface IAuth {
  userAuthId: string;
  username: string;
  email: string;
  hashPassword: string;
}

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
