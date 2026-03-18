import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // ───────────────────────────────────────────────────────────────────────────
  //  UTILITY
  // ───────────────────────────────────────────────────────────────────────────

  @Get('templates')
  @ApiOperation({ summary: 'List all available email template names' })
  getTemplates(): string[] {
    return this.emailService.getTemplateNames();
  }

  @Post('test-send')
  @ApiOperation({ summary: 'Health-check test email' })
  async sendTestEmail() {
    return this.emailService.sendTestEmail();
  }

  @Post('send/:template')
  @ApiOperation({ summary: 'Send email by template name (generic)' })
  @ApiResponse({ status: 200, description: 'Email sent' })
  @ApiResponse({ status: 400, description: 'Unknown template' })
  async sendByTemplate(
    @Param('template') template: string,
    @Body() dto: SendEmailDto,
  ) {
    return this.emailService.sendTemplateEmail(
      template,
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  APPLICATION EMAILS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('application/welcome')
  @ApiOperation({ summary: 'Welcome — account created' })
  async welcome(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'welcome',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/submitted')
  @ApiOperation({ summary: 'Application submitted successfully' })
  async submitted(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'submitted',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/incomplete')
  @ApiOperation({ summary: 'Reminder — application incomplete' })
  async incomplete(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'incomplete',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/deleted')
  @ApiOperation({ summary: 'Application deleted' })
  async deleted(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'deleted',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/decision-made')
  @ApiOperation({ summary: 'Decision made on application' })
  async decisionMade(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'decisionMade',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/approved')
  @ApiOperation({ summary: 'Application approved' })
  async approved(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'approved',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/rejected')
  @ApiOperation({ summary: 'Application rejected' })
  async rejected(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'rejected',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/room-assignment')
  @ApiOperation({ summary: 'Room assignment ready' })
  async roomAssignment(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'roomAssignment',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('application/announcement')
  @ApiOperation({ summary: 'General housing announcement' })
  async announcement(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'announcement',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  PAYMENT EMAILS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('payment/failed')
  @ApiOperation({ summary: 'Payment failed' })
  async paymentFailed(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'paymentFailed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('payment/successful')
  @ApiOperation({ summary: 'Payment successful' })
  async paymentSuccessful(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'paymentSuccessful',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  DOCUMENT / APPLICATION STATUS EMAILS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('document/upload-failed')
  @ApiOperation({ summary: 'Document upload failed' })
  async uploadFailed(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'uploadFailed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('document/missing-documents')
  @ApiOperation({ summary: 'Missing documents reminder' })
  async missingDocuments(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'missingDocuments',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('document/deadline-passed')
  @ApiOperation({ summary: 'Application deadline passed' })
  async deadlinePassed(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'deadlinePassed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  LEASE / CONTRACT EMAILS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('lease/available')
  @ApiOperation({ summary: 'Lease available for review & signing' })
  async leaseAvailable(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'leaseAvailable',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('lease/offer-issued')
  @ApiOperation({ summary: 'Lease offer issued — awaiting student signature' })
  async leaseOfferIssued(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'leaseOfferIssued',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('lease/accepted-welcome')
  @ApiOperation({ summary: 'Welcome email after student signs lease' })
  async leaseAcceptedWelcome(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'leaseAcceptedWelcome',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  BULLETIN EMAILS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('bulletin/posted')
  @ApiOperation({ summary: 'New post on the bulletin board' })
  async bulletinPosted(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'bulletinPosted',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  MAINTENANCE EMAILS
  // ───────────────────────────────────────────────────────────────────────────

  @Post('maintenance/opened')
  @ApiOperation({ summary: 'Maintenance request submitted and opened' })
  async maintenanceOpened(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'maintenanceOpened',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('maintenance/closed')
  @ApiOperation({ summary: 'Maintenance request resolved/closed' })
  async maintenanceClosed(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'maintenanceClosed',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }

  @Post('maintenance/comment-added')
  @ApiOperation({ summary: 'New comment added to maintenance request' })
  async maintenanceCommentAdded(@Body() dto: SendEmailDto) {
    return this.emailService.sendTemplateEmail(
      'maintenanceCommentAdded',
      dto.to,
      dto.firstName,
      dto.context,
      dto.portalUrl,
    );
  }
}
