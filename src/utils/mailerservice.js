import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASSWORD
    }
});

const sendMail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM, // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: htmlContent // HTML body
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// ye receiver mail aur receiver username lega
const sendRegistrationMail = async (to, username) => {
    const subject = 'Welcome to Our Service';
    const htmlContent = `
        <!DOCTYPE html>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .email-header {
      background-color: #007BFF;
      color: white;
      padding: 10px;
      text-align: center;
    }
    .email-body {
      padding: 20px;
      font-size: 16px;
      font-weight: 500;
      color: #597061;
    }
    .content-head {
      font-size: 20px;
      font-weight: 600;
      color: #505D54;
    }
    .email-footer {
      padding: 10px;
      text-align: center;
      color: #555;
      font-size: 12px;
    }
    @media (max-width: 600px) {
      .email-container {
        width: 100%;
        padding: 10px;
      }
      .email-body, .email-footer {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Welcome to Paws Care!</h1>
    </div>
    <div class="email-body">
      <p class="content-head">Dear ${username},</p>
      <p>A warm welcome from Paws Care! We're thrilled to have you on board.<br/><br/>
      Thank you for choosing us as your trusted partner for all your pet care needs. Our mission is to provide top-notch care and services to ensure your furry friends lead happy, healthy lives.<br/><br/>
      To get started, please feel free to explore our website and discover the various services we offer, including:</p>
      <ul>
        <li>Pet grooming and styling</li>
        <li>Veterinary care and consultations</li>
        <li>Pet diet plans</li>
        <li>Pet training and behavior guidance</li>
      </ul>
      <p>If you have any questions or need assistance, our dedicated team is always here to help.<br/><br/>
      Thank you again for joining our pet care community!<br/>
      <p class="content-head">Best regards,<br/><br/>
        Paws Care, Team</p>
    </div>
    <div class="email-footer">
      <p>&copy; 2025 Paws Care. All rights &reg; reserved under JMPC, IT department.</p>
    </div>
  </div>


    `;
    await sendMail(to, subject, htmlContent);
};

// ye user-email , username aur otp accept karega
const sendOtpMail = async (to, username, otp) => {
    const subject = 'Your OTP for Password Reset';
    const htmlContent = `
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .email-header {
      background-color: #007BFF;
      color: white;
      padding: 10px;
      text-align: center;
    }
    .email-body {
      padding: 20px;
      font-size: 18px;
      font-weight: 500;
      color: #748379;
    }
    .content-head {
      font-size: 20px;
      font-weight: 600;
      color: #505D54;
    }
    .email-footer {
      padding: 10px;
      text-align: center;
      color: #555;
      font-size: 12px;
    }
    @media (max-width: 600px) {
      .email-container {
        width: 100%;
        padding: 10px;
      }
      .email-body, .email-footer {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Welcome to Paws Care!</h1>
    </div>
    <div class="email-body">
      <p class="content-head">Dear ${username},</p>
      <p>We received a request to reset your password. To verify your identity, we've generated an OTP for you.</p>
      <p>Your OTP is: <strong class="content-head">${otp}</strong></p>
      <p>Please enter this OTP on our website to proceed with the password reset process.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
      <p class="content-head">Best regards,<br/><br/>
      Paws Care, Team</p>
    </div>
    <div class="email-footer">
      <p>&copy; 2025 Paws Care. All rights &reg; reserved under JMPC, IT department.</p>
    </div>
  </div>
    `;
    await sendMail(to, subject, htmlContent);
};

// ye accept karega user-email, username aur bookingDetils ={service: ,date: ,time: } "jo object hoga"   
const sendBookingConfirmationMail = async (to, bookingDetails) => {
    const subject = 'Booking Confirmation';
    const htmlContent = `    
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      padding: 20px;
      margin: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      overflow: hidden;
    }
    .email-header {
      background-color: #007BFF;
      color: white;
      padding: 10px;
      text-align: center;
    }
    .email-body {
      padding: 20px;
      font-size: 18px;
      font-weight: 500;
      color: #748379;
    }
    .content-head {
      font-size: 20px;
      font-weight: 600;
      color: #505D54;
    }
    .email-footer {
      padding: 10px;
      text-align: center;
      color: #555;
      font-size: 12px;
    }
    @media (max-width: 600px) {
      .email-container {
        width: 100%;
        padding: 10px;
      }
      .email-body, .email-footer {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <h1>Service Booking Confirmation</h1>
    </div>
    <div class="email-body">
      <p class="content-head">Dear ${username},</p>
      <p>We are glad to announce your booking confirmation.<br/>
      Below is you booking details.</p>
      
     <ul class="content-head">
        <li><strong>Service:</strong> ${bookingDetails.service}</li>
        <li><strong>Date:</strong> ${bookingDetails.date}</li>
        <li><strong>Time:</strong> ${bookingDetails.time}</li>
      </ul></p>
      <p class="content-head">Best regards,<br/><br/>
        Paws Care, Team</p>
    </div>
    <div class="email-footer">
      <p>&copy; 2025 Paws Care. All rights &reg; reserved under JMPC, IT department.</p>
    </div>
  </div>
    `;
    await sendMail(to, subject, htmlContent);
};

export { 
        sendRegistrationMail,
        sendOtpMail, 
        sendBookingConfirmationMail };
