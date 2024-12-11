import { EmailField, PasswordField, StringField } from '@/decorators/field.decorators';

export class VerifyForgotPasswordReqDto {
  @EmailField()
  email!: string;

  @StringField()
  otp!: string

  @PasswordField()
  password!: string;
}
