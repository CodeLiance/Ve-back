import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAIL_PROVIDER, MailProvider, OutgoingEmail } from './mail-provider.interface';
import { twoFactorCodeEmail } from './templates/two-factor-code.template';
import { passwordResetEmail } from './templates/password-reset.template';

/**
 * Arma los correos transaccionales de Ve! a partir de sus plantillas y los
 * entrega a través del MailProvider que el MailModule inyecta. No sabe si el
 * correo sale por Resend o se escribe en consola: depende solo de la interfaz.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(@Inject(MAIL_PROVIDER) private readonly provider: MailProvider) {}

  async sendTwoFactorCode(to: string, code: string, userName: string): Promise<void> {
    const { subject, html, text } = twoFactorCodeEmail({ code, userName });
    await this.deliver({ to, subject, html, text }, 'No se pudo enviar el correo de verificación');
  }

  async sendPasswordResetCode(to: string, code: string, userName: string): Promise<void> {
    const { subject, html, text } = passwordResetEmail({ code, userName });
    await this.deliver({ to, subject, html, text }, 'No se pudo enviar el correo de recuperación');
  }

  private async deliver(email: OutgoingEmail, failureMessage: string): Promise<void> {
    try {
      await this.provider.send(email);
    } catch (err: any) {
      this.logger.error(`${failureMessage} a ${email.to}: ${err?.message ?? err}`);
      throw new Error(failureMessage);
    }
  }
}
