import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentSessionDto } from './dtos/payment-session.dto';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // @Post('create-payment-session')
  @MessagePattern('create.payment.session')
  createPaymentSession(@Payload() paymentSessionDto : PaymentSessionDto) {
    
    // return paymentSessionDto;
    return this.paymentsService.createPaymentSession(paymentSessionDto);
  }

  @Get('success')
  success() {
    return this.paymentsService.success();
  }

  @Get('cancel')
  cancel() {
    return this.paymentsService.cancel();
  }

  @Post('webhook')
  stripeWebhook(@Req() req : Request, @Res() res : Response) {
    console.log("STRIPE WEBHOOK CALLED")
    return this.paymentsService.stripeWebHook(req, res);
  }
}
