import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /** Student: get payment summary (balance, amount due, total paid) */
  @Get('summary')
  async getPaymentSummary(@Req() req: any) {
    const userId = parseInt(req.query.userId) || 1;
    return this.paymentService.getPaymentSummary(userId);
  }

  /** Student: get payment history */
  @Get('my-payments')
  async getMyPayments(@Req() req: any) {
    const userId = parseInt(req.query.userId) || 1;
    return this.paymentService.getMyPayments(userId);
  }

  /** Student: make a payment (simulated) */
  @Post('pay')
  async makePayment(@Body() body: any) {
    const { userId, amount, method } = body;
    return this.paymentService.makePayment(userId, { amount, method });
  }

  /** Staff: view all payments */
  @Get('all')
  async getAllPayments() {
    return this.paymentService.getAllPayments();
  }
}
