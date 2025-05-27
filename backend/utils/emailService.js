import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send room update emails
const sendRoomUpdateEmail = async (subscribers, roomData) => {
  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    subject: `New Room Update at WG Hotel - ${roomData.name}`,
    html: `
      <h2>New Room Update at WG Hotel</h2>
      <h3>${roomData.name}</h3>
      <p>${roomData.description}</p>
      <div style="margin: 20px 0;">
        <strong>Details:</strong>
        <ul>
          <li>Type: ${roomData.type}</li>
          <li>Price: $${roomData.price}</li>
          <li>Capacity: ${roomData.capacity} persons</li>
        </ul>
      </div>
      <p>Book now to experience luxury at its finest!</p>
      <p>Best regards,<br>WG Hotel Team</p>
    `
  };

  // Send email to each subscriber
  for (const subscriber of subscribers) {
    try {
      mailOptions.to = subscriber.email;
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${subscriber.email}`);
    } catch (error) {
      console.error(`Failed to send email to ${subscriber.email}:`, error);
    }
  }
};

// Function to send password reset emails
const sendPasswordResetEmail = async (email, resetToken) => {
  // Create reset URL that user will receive
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: 'Password Reset Request - WG Hotel',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Password Reset Request</h2>
        </div>
        <p>Hello,</p>
        <p>You requested a password reset for your WG Hotel account. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #F59E0B; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email or contact our support team if you have concerns.</p>
        <p>Best regards,<br>WG Hotel Team</p>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;">
          <p>This is an automated email, please do not reply to this message.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${email}:`, error);
    return false;
  }
};

export { sendRoomUpdateEmail, sendPasswordResetEmail };
