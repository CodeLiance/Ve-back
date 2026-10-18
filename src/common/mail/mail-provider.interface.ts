/**
 * Contrato mínimo para entregar un correo ya armado.
 *
 * MailService arma el mensaje (plantilla, asunto, texto) y delega la entrega
 * a un MailProvider. Así el servicio no depende de Resend ni de ningún otro
 * proveedor concreto: depende de esta interfaz, y el MailModule decide cuál
 * implementación inyectar (ResendMailProvider en producción, ConsoleMailProvider
 * en desarrollo sin API key). Agregar otro proveedor (SMTP, SES…) es crear una
 * clase nueva que implemente esta interfaz, sin tocar MailService ni AuthService.
 */
export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  /** Versión en texto plano: mejora la entregabilidad y es lo que se ve en consola en desarrollo. */
  text: string;
}

export interface MailProvider {
  /** Resuelve cuando el correo quedó entregado o encolado; rechaza si no se pudo enviar. */
  send(email: OutgoingEmail): Promise<void>;
}

/** Token de inyección: las interfaces de TypeScript no existen en tiempo de ejecución. */
export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');
