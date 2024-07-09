import { Inject, Injectable } from '@nestjs/common';
import { envs } from 'src/config/envs';
import Stripe from 'stripe';
import { PaymentSessionDto } from './dtos/payment-session.dto';
import { Request, Response } from 'express';
import { NATS_SERVICE } from 'src/config/services';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PaymentsService {

  private readonly stripe = new Stripe( envs.stripe_secret );

  constructor(
    @Inject(NATS_SERVICE) private readonly client : ClientProxy
  ){}
  
  async createPaymentSession( paymentSessionDto : PaymentSessionDto ) {
    

    const { currency, items, orderId } = paymentSessionDto;

    const lineItems = items.map( item => ({
      price_data : {
        currency : currency,
        product_data : {
          name : item.name
        },
        unit_amount : Math.round( item.price * 100 ),
      },
      quantity : item.quantity
    }))

    const session = await this.stripe.checkout.sessions.create({
      //COLOCAR ID DE LA ORDEN
      payment_intent_data : {
        metadata : {
          orderId
        }
      },
      line_items : lineItems,
      mode : 'payment',
      success_url : envs.stripe_success_url,
      cancel_url : envs.stripe_cancel_url
    })
  
    return {
      cancelUrl : session.cancel_url,
      successUrl : session.success_url,
      url : session.url
    };
  }

  

  success() {
    return 'success';
  }

  cancel() {
    return 'cancel';
  }
  

  async stripeWebHook( req : Request, res : Response ){

    const sig = req.headers['stripe-signature'];

    let event : Stripe.Event;
    // const endpointSecret = "whsec_12513cc4d52a3d99bd9755be55325979038834b98ab3b70e0eec8c1cfd7f4bd7"; TESTING
    const endpointSecret = envs.stripe_endpoint_secret; //REAL

    try {
      event = this.stripe.webhooks.constructEvent(req['rawBody'] , sig, endpointSecret);

    } catch (error) {
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }


    switch (event.type) {
      case 'charge.succeeded':
        //TODO llamar microservicio
        // console.log(event)

        const charge = event.data.object;
        const payload = {
          stripePaymentId : charge.id,
          orderId : charge.metadata.orderId,
          receiptUrl : charge.receipt_url
        }

        this.client.emit('payment.succeeded', payload);
        break;
      default:
        //Evento no controlado
        break;
    }


    return res.status(200).json({
      sig
    })

  }

}
