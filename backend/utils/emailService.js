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

export { sendRoomUpdateEmail };
