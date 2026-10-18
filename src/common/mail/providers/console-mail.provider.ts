import { Logger } from '@nestjs/common';
import { MailProvider, OutgoingEmail } from '../mail-provider.interface';

/**
 * En desarrollo, sin una API key real de Resend, no se puede enviar correo.
 * En vez de reventar el login/registro con un 500, el mensaje (con su código)
 * se escribe en la consola para poder continuar el flujo en local.
 * El MailModule nunca lo elige en producción.
 */
export class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger(ConsoleMailProvider.name);

  async send(email: OutgoingEmail): Promise<void> {
    this.logger.warn(`[DEV] "${email.subject}" para ${email.to}: ${email.text}`);
  }
}
