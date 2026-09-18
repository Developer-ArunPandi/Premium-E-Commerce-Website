const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'ShopSphere <noreply@shopsphere.com>',
    to,
    subject,
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

const sendPasswordResetEmail = async (user, resetToken, clientUrl) => {
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px;">ShopSphere</h1>
      </div>
      <div style="background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #1a1a2e; margin-bottom: 20px;">Reset Your Password</h2>
        <p style="color: #555; line-height: 1.6;">Hi ${user.firstName},</p>
        <p style="color: #555; line-height: 1.6;">You requested to reset your password. Click the button below to set a new password. This link will expire in 10 minutes.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #888; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #aaa; font-size: 12px; text-align: center;">© 2024 ShopSphere. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'Reset Your ShopSphere Password',
    html,
    text: `Reset your password at: ${resetUrl}`,
  });
};

const sendOrderConfirmationEmail = async (user, order) => {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">ShopSphere</h1>
      </div>
      <div style="background: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #1a1a2e;">Order Confirmed! 🎉</h2>
        <p style="color: #555;">Hi ${user.firstName}, your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Order Summary</h3>
          ${order.items.map((item) => `<p style="color: #555; margin: 5px 0;">${item.name} x${item.quantity} - ₹${item.total}</p>`).join('')}
          <hr style="border: none; border-top: 1px solid #ddd;">
          <p style="font-weight: 600; color: #333;">Total: ₹${order.total}</p>
        </div>
        <p style="color: #888; font-size: 14px;">We'll notify you when your order is shipped.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: `Order Confirmed - #${order.orderNumber} | ShopSphere`,
    html,
    text: `Order ${order.orderNumber} confirmed. Total: ₹${order.total}`,
  });
};

module.exports = { sendEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
