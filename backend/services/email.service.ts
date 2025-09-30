import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    const postmarkToken = process.env.POSTMARK_TOKEN;
    const fromEmail = process.env.EMAIL_FROM || "noreply@fixmyrv.com";

    if (!postmarkToken) {
      console.warn(
        "⚠️  POSTMARK_TOKEN not configured - email features will be disabled"
      );
      // Create a dummy transporter that logs instead of sending
      this.transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: "unix",
        buffer: true,
      });
    } else {
      // Use Postmark SMTP
      this.transporter = nodemailer.createTransport({
        host: "smtp.postmarkapp.com",
        port: 587,
        secure: false,
        auth: {
          user: postmarkToken,
          pass: postmarkToken,
        },
      });
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(
    to: string,
    subject: string,
    html: string
  ): Promise<void> {
    try {
      const fromEmail = process.env.EMAIL_FROM || "noreply@fixmyrv.com";

      await this.transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent successfully to ${to}`);
    } catch (error: any) {
      console.error("❌ Error sending email:", error);
      throw new Error(`Error sending email: ${error.message}`);
    }
  }
}

export default EmailService.getInstance();
