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
const sendRoomUpdateEmail = async (subscribers, roomData, type = 'new') => {
  // Determine email subject and title based on update type
  const isNew = type === 'new';
  const emailSubject = isNew 
    ? `New Room Available at WG Hotel - ${roomData.name}` 
    : `Room Update at WG Hotel - ${roomData.name}`;
  
  const emailTitle = isNew 
    ? `New Room Available: ${roomData.name}` 
    : `Room Update: ${roomData.name}`;
  
  const actionText = isNew 
    ? 'Check out our new room and book now to experience luxury at its finest!' 
    : 'Check out the updated details and book now to experience luxury at its finest!';

  // Configure mailOptions with anti-spam best practices
  const mailOptions = {
    from: `"WG Hotel" <${process.env.EMAIL_SENDER}>`,  // Proper format: "Name" <email>
    subject: emailSubject,
    // Make sure to include List-Unsubscribe header to avoid spam filters
    headers: {
      'List-Unsubscribe': `<${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe>`,
      'Precedence': 'bulk'
    },
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 20px; background-color: #F59E0B; text-align: center;">
              <h1 style="color: #1F2937; margin: 0; font-size: 24px;">WG Hotel</h1>
            </td>
          </tr>
          
          <!-- Room Image if available -->
          ${roomData.images && roomData.images.length > 0 ? `
          <tr>
            <td style="padding: 0;">
              <img src="${roomData.images[0].url}" alt="${roomData.name}" style="width: 100%; max-height: 300px; object-fit: cover;">
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <h2 style="color: #1F2937; margin-top: 0;">${emailTitle}</h2>
              <p style="color: #4B5563; line-height: 1.6;">${roomData.description}</p>
              
              <div style="margin: 20px 0; background-color: #F3F4F6; padding: 15px; border-radius: 8px;">
                <h3 style="color: #1F2937; margin-top: 0;">Room Details:</h3>
                <ul style="color: #4B5563; padding-left: 20px;">
                  <li>Type: ${roomData.roomType}</li>
                  <li>Price: ${formatPrice(roomData.price)}</li>
                  <li>Capacity: ${roomData.capacity} persons</li>
                  ${roomData.amenities && roomData.amenities.length > 0 ? 
                    `<li>Amenities: ${roomData.amenities.join(', ')}</li>` : ''}
                </ul>
              </div>
              
              <p style="color: #4B5563; line-height: 1.6;">${actionText}</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/rooms" style="background-color: #F59E0B; color: #1F2937; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">Book Now</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #F3F4F6; text-align: center; font-size: 12px; color: #6B7280;">
              <p>© ${new Date().getFullYear()} WG Hotel. All rights reserved.</p>
              <p>You're receiving this email because you signed up for updates from WG Hotel.</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email={{RECIPIENT}}" style="color: #1F2937; text-decoration: underline;">Unsubscribe</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #1F2937; text-decoration: underline;">Visit Website</a>
              </p>
              <p style="margin-top: 15px; font-size: 11px; color: #9CA3AF;">
                WG Hotel, Jl. Raya Kuta No.123, Kuta, Bali, Indonesia
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  // Add some delay between emails to avoid triggering spam filters
  const batchSize = 50; // Send in batches
  const delayBetweenBatches = 5000; // 5 seconds between batches

  // Process subscribers in batches
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    // Process each subscriber in the current batch
    for (const subscriber of batch) {
      try {
        // Replace placeholder with actual recipient email for unsubscribe link
        const personalizedHtml = mailOptions.html.replace('{{RECIPIENT}}', encodeURIComponent(subscriber.email));
        
        await transporter.sendMail({
          ...mailOptions,
          to: subscriber.email,
          html: personalizedHtml
        });
        
        console.log(`Room update email sent successfully to ${subscriber.email}`);
      } catch (error) {
        console.error(`Failed to send room update email to ${subscriber.email}:`, error);
      }
    }
    
    // Delay between batches to avoid triggering spam filters
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
}

// Helper function to format price
function formatPrice(price) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
}

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

// Function to send newsletter emails
const sendNewsletter = async (subscribers, newsletterData) => {
  // Add some delay between emails to avoid triggering spam filters
  const batchSize = 50; // Send in batches
  const delayBetweenBatches = 5000; // 5 seconds between batches
  
  // Configure mailOptions with anti-spam best practices
  const mailOptions = {
    from: `"WG Hotel" <${process.env.EMAIL_SENDER}>`,  // Proper format: "Name" <email>
    subject: newsletterData.subject || 'Latest Updates from WG Hotel',
    // Make sure to include List-Unsubscribe header to avoid spam filters
    headers: {
      'List-Unsubscribe': `<${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe>`,
      'Precedence': 'bulk'
    },
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${newsletterData.subject || 'WG Hotel Newsletter'}</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f7f7f7;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 20px; background-color: #F59E0B; text-align: center;">
              <h1 style="color: #1F2937; margin: 0; font-size: 24px;">WG Hotel Newsletter</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px 20px;">
              <h2 style="color: #1F2937; margin-top: 0;">${newsletterData.title || 'Latest Updates'}</h2>
              <p style="color: #4B5563; line-height: 1.6;">${newsletterData.greeting || 'Dear Valued Guest,'}</p>
              
              <div style="margin: 20px 0;">
                ${newsletterData.content || `
                  <p style="color: #4B5563; line-height: 1.6;">Thank you for subscribing to our newsletter. We're excited to share our latest updates with you.</p>
                  <p style="color: #4B5563; line-height: 1.6;">Stay tuned for exclusive offers and promotions available only to our subscribers.</p>
                `}
              </div>
              
              ${newsletterData.callToAction ? `
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${newsletterData.callToAction.url}" style="background-color: #F59E0B; color: #1F2937; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; display: inline-block;">${newsletterData.callToAction.text}</a>
                </div>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px; background-color: #F3F4F6; text-align: center; font-size: 12px; color: #6B7280;">
              <p>© ${new Date().getFullYear()} WG Hotel. All rights reserved.</p>
              <p>You're receiving this email because you signed up for updates from WG Hotel.</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email={{RECIPIENT}}" style="color: #1F2937; text-decoration: underline;">Unsubscribe</a> | 
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #1F2937; text-decoration: underline;">Visit Website</a>
              </p>
              <p style="margin-top: 15px; font-size: 11px; color: #9CA3AF;">
                WG Hotel, Jl. Raya Songnipi No.16 Ungasan, Kuta Selatan, Badung, Bali, Indonesia
              </p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  // Send emails in batches
  let successCount = 0;
  let failCount = 0;

  // Process subscribers in batches
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    // Process each subscriber in the current batch
    for (const subscriber of batch) {
      try {
        // Replace placeholder with actual recipient email for unsubscribe link
        const personalizedHtml = mailOptions.html.replace('{{RECIPIENT}}', encodeURIComponent(subscriber.email));
        
        await transporter.sendMail({
          ...mailOptions,
          to: subscriber.email,
          html: personalizedHtml
        });
        
        console.log(`Newsletter sent successfully to ${subscriber.email}`);
        successCount++;
      } catch (error) {
        console.error(`Failed to send newsletter to ${subscriber.email}:`, error);
        failCount++;
      }
    }
    
    // Delay between batches to avoid triggering spam filters
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }
  
  return {
    success: true,
    successCount,
    failCount,
    total: subscribers.length
  };
};

export { sendRoomUpdateEmail, sendPasswordResetEmail, sendNewsletter };
