# Mail Configuration Setup

## Gmail SMTP Configuration

To send real emails instead of using Mailtrap sandbox, follow these steps:

### 1. Enable 2-Factor Authentication on Gmail
- Go to your Google Account settings
- Enable 2-Factor Authentication if not already enabled

### 2. Generate App Password
- Go to Google Account settings
- Navigate to Security > 2-Step Verification > App passwords
- Generate a new app password for "Mail"
- Copy the generated 16-character password

### 3. Update Environment Variables
Create a `.env` file based on `env.template` and update the following variables:

```env
# Mail Configuration (Gmail SMTP for real emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-actual-gmail@gmail.com
```

### 4. Alternative Email Services

#### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your-email@outlook.com
```

#### SendGrid
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=your-verified-sender@yourdomain.com
```

#### AWS SES
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-ses-smtp-username
EMAIL_PASSWORD=your-ses-smtp-password
EMAIL_FROM=your-verified-sender@yourdomain.com
```

### 5. Testing
After configuration, restart your application and test the email functionality. Emails should now be sent to real email addresses instead of being caught by the sandbox.

### Security Notes
- Never commit your `.env` file to version control
- Use app passwords instead of your main Gmail password
- Consider using environment-specific configurations for development/production 
