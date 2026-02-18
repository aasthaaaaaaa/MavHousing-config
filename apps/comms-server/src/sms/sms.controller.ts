import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';

@ApiTags('SMS')
@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  // ───────────────────────────────────────────────────────────────────────────
  //  UTILITY
  // ───────────────────────────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'List all available SMS template names' })
  getTemplates(): string[] {
    return this.smsService.getTemplateNames();
  }

  @Post('send/:template')
  @ApiOperation({ summary: 'Send SMS by template name (generic)' })
  @ApiResponse({ status: 200, description: 'SMS sent' })
  @ApiResponse({ status: 400, description: 'Unknown template' })
  async sendByTemplate(
    @Param('template') template: string,
    @Body() dto: SendSmsDto,
  ) {
    return this.smsService.sendTemplateSms(
      template,
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  APPLICATION SMS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('application/welcome')
  @ApiOperation({ summary: 'Welcome — account created' })
  async welcome(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'welcome',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/submitted')
  @ApiOperation({ summary: 'Application submitted' })
  async submitted(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'submitted',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/incomplete')
  @ApiOperation({ summary: 'Application incomplete reminder' })
  async incomplete(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'incomplete',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/deleted')
  @ApiOperation({ summary: 'Application deleted' })
  async deleted(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'deleted',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/decision-made')
  @ApiOperation({ summary: 'Decision made on application' })
  async decisionMade(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'decisionMade',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/approved')
  @ApiOperation({ summary: 'Application approved' })
  async approved(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'approved',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/rejected')
  @ApiOperation({ summary: 'Application rejected' })
  async rejected(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'rejected',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/room-assignment')
  @ApiOperation({ summary: 'Room assignment ready' })
  async roomAssignment(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'roomAssignment',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/announcement')
  @ApiOperation({ summary: 'General housing announcement' })
  async announcement(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'announcement',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  PAYMENT SMS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('payment/failed')
  @ApiOperation({ summary: 'Payment failed' })
  async paymentFailed(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'paymentFailed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('payment/successful')
  @ApiOperation({ summary: 'Payment successful' })
  async paymentSuccessful(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'paymentSuccessful',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  DOCUMENT / APPLICATION STATUS SMS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('document/upload-failed')
  @ApiOperation({ summary: 'Document upload failed' })
  async uploadFailed(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'uploadFailed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('document/missing-documents')
  @ApiOperation({ summary: 'Missing documents reminder' })
  async missingDocuments(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'missingDocuments',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('document/deadline-passed')
  @ApiOperation({ summary: 'Application deadline passed' })
  async deadlinePassed(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'deadlinePassed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  LEASE / CONTRACT SMS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('lease/available')
  @ApiOperation({ summary: 'Lease available for review & signing' })
  async leaseAvailable(@Body() dto: SendSmsDto) {
    return this.smsService.sendTemplateSms(
      'leaseAvailable',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }
}
