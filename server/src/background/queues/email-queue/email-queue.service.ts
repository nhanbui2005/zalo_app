import { ISendOTPEmailJob, ISendPasswordEmailJob, IVerifyEmailJob } from '@/common/interfaces/job.interface';
import { MailService } from '@/mail/mail.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(private readonly mailService: MailService) {}

  async sendEmailVerification(data: IVerifyEmailJob): Promise<void> {
    this.logger.debug(`Sending email verification to ${data.email}`);
    await this.mailService.sendEmailVerification(data.email, data.token);
  }

  async sendEmailSendPassword(data: ISendPasswordEmailJob): Promise<void> {
    this.logger.debug(`Sending email send password to ${data.email}`);
    await this.mailService.sendEmailSendPassword(data.email, data.password);
  }

  async sendOTPForgotPassword(data: ISendOTPEmailJob): Promise<void> {
    this.logger.debug(`Sending email otp forgot password to ${data.email}`);
    await this.mailService.sendEmailOTPForgotPassword(data.email, data.otp);
  }
}
