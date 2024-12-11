import { EmailField, StringField } from '@/decorators/field.decorators';

export class LoginWithGoogleReqDto {
  @EmailField()
  email?: string;

  @StringField()
  providerId: string

  @StringField()
  firstName: string

  @StringField()
  lastName: string

  @StringField()
  imageUrl:string
}
