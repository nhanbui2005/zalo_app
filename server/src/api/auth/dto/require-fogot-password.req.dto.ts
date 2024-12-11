import { EmailField } from '@/decorators/field.decorators';

export class RequireForgotPasswordReqDto {
  @EmailField()
  email!: string;
}
