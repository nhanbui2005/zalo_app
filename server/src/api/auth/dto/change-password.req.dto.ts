import { PasswordField } from '@/decorators/field.decorators';

export class ChangePasswordReqDto {

  @PasswordField()
  oldPassword!: string;

  @PasswordField()
  newPassword!: string;
}
