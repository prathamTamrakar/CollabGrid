import sgMail from '@sendgrid/mail';
import { config } from '../config/env.js';

if (config.sendgridApiKey) {
  sgMail.setApiKey(config.sendgridApiKey);
}

export async function sendEmailOtp({ toEmail, subject, otp, registration = false }) {
  // Only log OTP to console in development / test environments
  if (config.env !== 'production') {
    console.log(`\n======================================================`);
    console.log(`[OTP NOTIFICATION] To: ${toEmail} | Subject: ${subject}`);
    console.log(`[OTP NOTIFICATION] Your OTP is: >>> ${otp} <<< (Valid for 10 minutes)`);
    console.log(`======================================================\n`);
  }

  if (config.sendgridApiKey && config.fromEmail) {
    const logoUrl = `${config.frontendUrl}/logo.png`;
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f6f8fa; padding: 40px 0;">
        <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(80,80,120,0.08); padding: 32px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <img src='${logoUrl}' alt='CollabGrid' width='180' style='margin-bottom: 12px;'/>
            <h2 style="margin: 0; color: #4f46e5; font-size: 1.75rem; font-weight: 700;">
              ${registration ? 'Verify Your Email' : 'Password Reset OTP'}
            </h2>
          </div>
          <p style="font-size: 1rem; color: #334155; margin-bottom: 16px;">
            ${registration ? 'Welcome to CollabGrid! To complete your registration, please verify your email address using the OTP below:' : 'We received a request to reset your CollabGrid password. Use the OTP below to continue:'}
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="display: inline-block; font-size: 2.2rem; letter-spacing: 0.35rem; color: #ffffff; background: linear-gradient(90deg,#6366f1,#4f46e5); padding: 14px 36px; border-radius: 10px; font-weight: bold; box-shadow: 0 2px 8px rgba(99,102,241,0.25);">${otp}</span>
          </div>
          <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 16px;">This OTP is valid for <b>10 minutes</b>. Never share this code with anyone.</p>
          <p style="font-size: 0.9rem; color: #94a3b8; margin-top: 28px; text-align: center;">&mdash; The CollabGrid Team</p>
        </div>
      </div>
    `;

    try {
      await sgMail.send({
        to: toEmail,
        from: config.fromEmail,
        subject,
        text: `Your OTP is: ${otp}\nIt is valid for 10 minutes.`,
        html: htmlContent
      });
    } catch (e) {
      console.warn('[EMAIL SERVICE] SendGrid notification warning:', e.message);
    }
  }
}

export default {
  sendEmailOtp
};
