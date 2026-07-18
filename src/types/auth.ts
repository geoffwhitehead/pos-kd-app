export type AuthSession = {
  accessToken: string;
  refreshToken: string;
};

export type SignInParams = {
  email: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refreshToken: string;
};
