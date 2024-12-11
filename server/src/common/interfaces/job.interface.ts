export interface IEmailJob {
  email: string;
}

export interface IVerifyEmailJob extends IEmailJob {
  token: string;
}

export interface ISendPasswordEmailJob extends IEmailJob {
  password: string;
}

export interface ISendOTPEmailJob extends IEmailJob {
  otp: string;
}
