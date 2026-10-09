export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type SignInParams = {
  code: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};
