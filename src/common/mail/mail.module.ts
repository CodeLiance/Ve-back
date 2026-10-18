import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MAIL_PROVIDER, MailProvider } from './mail-provider.interface';
import { ResendMailProvider } from './providers/resend-mail.provider';
import { ConsoleMailProvider } from './providers/console-mail.provider';

/**
 * Elige la implementación de MailProvider una sola vez, al arrancar:
 * con una API key real de Resend → ResendMailProvider; en desarrollo sin key
 * (o con el placeholder del .env.example) → ConsoleMailProvider. En producción
 * siempre se usa Resend, para que un correo que no sale falle de forma visible.
 */
function createMailProvider(config: ConfigService): MailProvider {
  const apiKey = config.get<string>('resend.apiKey');
  const nodeEnv = config.get<string>('nodeEnv') || 'development';
  const hasRealKey = !!apiKey && apiKey.startsWith('re_') && !/REEMPLA|tu-api-key|xxxx/i.test(apiKey);

  if (!hasRealKey && nodeEnv !== 'production') {
    new Logger('MailModule').warn(
      'RESEND_API_KEY no configurada — modo dev: los códigos se mostrarán en consola, no se enviará correo.',
    );
    return new ConsoleMailProvider();
  }
  return new ResendMailProvider(hasRealKey ? apiKey! : 're_dev_placeholder');
}

@Global()
@Module({
  providers: [
    { provide: MAIL_PROVIDER, useFactory: createMailProvider, inject: [ConfigService] },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
