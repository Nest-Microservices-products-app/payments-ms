import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  
  const logger = new Logger('Payments MS')

  const app = await NestFactory.create(AppModule,{ 
    rawBody : true
  });
  
  app.useGlobalPipes( new ValidationPipe({
    whitelist : true,
    forbidNonWhitelisted : true
  }))

  app.connectMicroservice<MicroserviceOptions>({
      transport : Transport.NATS,
      options : { servers : envs.nats_servers }
    }, 
    { inheritAppConfig : true }
  )

  await app.startAllMicroservices();
  await app.listen(envs.port);

  console.log('HealthCheck configured')
  logger.log(`Microservice running on port ${envs.port}`)

}
bootstrap();
