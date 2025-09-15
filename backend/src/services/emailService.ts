import nodemailer from 'nodemailer';
import { User } from '@prisma/client';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface NotificationData {
  type: 'deadline' | 'workload' | 'assignment' | 'milestone' | 'project_update';
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionUrl?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const emailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only create transporter if we have email credentials
    if (emailConfig.auth.user && emailConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('📧 Email service configured successfully');
    } else {
      console.log('⚠️ Email service not configured - SMTP credentials missing');
    }
  }

  private generateEmailTemplate(data: NotificationData, user: User): EmailTemplate {
    const priorityColors = {
      low: '#10B981',
      medium: '#F59E0B', 
      high: '#EF4444',
      critical: '#DC2626'
    };

    const priorityColor = priorityColors[data.priority];
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: user.timezone || 'UTC'
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${data.title} - BPL Commander</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .content { padding: 24px; }
          .notification-card { border-left: 4px solid ${priorityColor}; background-color: #f8fafc; padding: 16px; border-radius: 4px; margin: 16px 0; }
          .priority-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; background-color: ${priorityColor}; color: white; }
          .message { font-size: 16px; line-height: 1.6; color: #374151; margin: 16px 0; }
          .action-button { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 16px 0; }
          .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .timestamp { color: #9ca3af; font-size: 14px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 BPL Commander</h1>
          </div>
          <div class="content">
            <h2 style="margin: 0 0 16px 0; color: #1f2937;">${data.title}</h2>
            <div class="notification-card">
              <span class="priority-badge">${data.priority}</span>
              <div class="message">${data.message}</div>
              ${data.actionUrl ? `<a href="${data.actionUrl}" class="action-button">View Details</a>` : ''}
            </div>
            <div class="timestamp">
              <strong>Time:</strong> ${currentDate}<br>
              <strong>User:</strong> ${user.name} (${user.designation})
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from BPL Commander Project Management System.</p>
            <p>If you have any questions, please contact your system administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
BPL Commander Notification
========================

${data.title}
Priority: ${data.priority.toUpperCase()}

${data.message}

${data.actionUrl ? `View Details: ${data.actionUrl}` : ''}

Time: ${currentDate}
User: ${user.name} (${user.designation})

---
This is an automated notification from BPL Commander Project Management System.
If you have any questions, please contact your system administrator.
    `;

    return {
      subject: `[BPL Commander] ${data.title}`,
      html,
      text
    };
  }

  async sendNotification(user: User, data: NotificationData): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured, skipping email notification');
      return false;
    }

    // Check if user has email notifications enabled
    const notificationSettings = user.notificationSettings as any;
    if (!notificationSettings?.email) {
      console.log(`📧 Email notifications disabled for user ${user.email}`);
      return false;
    }

    try {
      const template = this.generateEmailTemplate(data, user);
      
      const mailOptions = {
        from: `"BPL Commander" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: template.subject,
        text: template.text,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`📧 Email sent successfully to ${user.email}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('📧 Failed to send email notification:', error);
      return false;
    }
  }

  async sendBulkNotifications(users: User[], data: NotificationData): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const success = await this.sendNotification(user, data);
        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`📧 Failed to send email to ${user.email}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  // Test email functionality
  async sendTestEmail(user: User): Promise<boolean> {
    const testData: NotificationData = {
      type: 'project_update',
      title: 'Email Service Test',
      message: 'This is a test email to verify that the BPL Commander email notification system is working correctly.',
      priority: 'medium'
    };

    return await this.sendNotification(user, testData);
  }
}

export const emailService = new EmailService();
