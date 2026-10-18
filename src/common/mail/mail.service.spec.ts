import { MailService } from './mail.service';
import { MailProvider, OutgoingEmail } from './mail-provider.interface';
import { ConsoleMailProvider } from './providers/console-mail.provider';

// Un proveedor falso que solo recuerda lo que le pidieron enviar.
class FakeMailProvider implements MailProvider {
  sent: OutgoingEmail[] = [];
  async send(email: OutgoingEmail): Promise<void> {
    this.sent.push(email);
  }
}

class FailingMailProvider implements MailProvider {
  async send(): Promise<void> {
    throw new Error('servicio caído');
  }
}

describe('MailService', () => {
  it('arma el correo 2FA y lo entrega al proveedor inyectado', async () => {
    const provider = new FakeMailProvider();
    await new MailService(provider).sendTwoFactorCode('ana@icesi.edu.co', '123456', 'Ana');

    expect(provider.sent).toHaveLength(1);
    expect(provider.sent[0].to).toBe('ana@icesi.edu.co');
    expect(provider.sent[0].text).toContain('123456');
    expect(provider.sent[0].html).toContain('123456');
  });

  it('el correo de recuperación también lleva el código en texto plano', async () => {
    const provider = new FakeMailProvider();
    await new MailService(provider).sendPasswordResetCode('ana@icesi.edu.co', '654321', 'Ana');

    expect(provider.sent[0].subject).toBe('Recuperación de contraseña');
    expect(provider.sent[0].text).toContain('654321');
  });

  it('funciona igual con cualquier implementación de MailProvider', async () => {
    const service = new MailService(new ConsoleMailProvider());
    await expect(service.sendTwoFactorCode('ana@icesi.edu.co', '123456', 'Ana')).resolves.toBeUndefined();
  });

  it('traduce una falla del proveedor a un error claro para AuthService', async () => {
    const service = new MailService(new FailingMailProvider());
    await expect(service.sendTwoFactorCode('ana@icesi.edu.co', '123456', 'Ana')).rejects.toThrow(
      'No se pudo enviar el correo de verificación',
    );
  });
});
