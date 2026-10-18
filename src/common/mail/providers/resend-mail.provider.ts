import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { MailProvider, OutgoingEmail } from '../mail-provider.interface';

// "Seguridad <no-reply@...>" from an unfamiliar domain is exactly the
// sender-name/domain pattern institutional anti-phishing filters (Google
// Workspace/M365 for Education) tend to silently quarantine — not even to a
// visible spam folder. Using the actual product name instead reads as a
// legitimate transactional sender rather than an impersonation attempt.
const MAIL_FROM = 'Ve! <no-reply@site3.uk>';

// El correo con el OTP es crítico para poder iniciar sesión: si la llamada a
// Resend falla por un problema de red transitorio (DNS, timeout, etc.), se
// reintenta unas veces antes de rendirse, en vez de obligar al usuario a
// pulsar "Reenviar código" manualmente para que el primer envío sí funcione.
const MAX_SEND_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Entrega los correos con la API de Resend, con reintentos ante fallas transitorias. */
export class ResendMailProvider implements MailProvider {
  private readonly logger = new Logger(ResendMailProvider.name);
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(email: OutgoingEmail): Promise<void> {
    let lastErrorMessage = 'Error desconocido';

    for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
      try {
        const { data, error } = await this.resend.emails.send({ from: MAIL_FROM, ...email });

        if (!error) {
          // Resend accepting the request only means it was queued, not that
          // it was actually delivered — log the message id so a "the code
          // never arrived" report can be cross-referenced against Resend's
          // own delivery log/webhook events instead of guessing blindly.
          this.logger.log(`"${email.subject}" encolado en Resend para ${email.to} (id: ${data?.id})`);
          return;
        }

        lastErrorMessage = error.message;
      } catch (err: any) {
        // Algunas fallas de red (DNS, timeout) llegan como excepción en vez
        // de como { error } en la respuesta de Resend.
        lastErrorMessage = err?.message || 'Error de red desconocido';
      }

      this.logger.warn(
        `Intento ${attempt}/${MAX_SEND_ATTEMPTS} fallido al enviar "${email.subject}" a ${email.to}: ${lastErrorMessage}`,
      );

      if (attempt < MAX_SEND_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }

    throw new Error(`Resend no pudo enviar el correo tras ${MAX_SEND_ATTEMPTS} intentos: ${lastErrorMessage}`);
  }
}
