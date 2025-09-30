-- Seed Admin User for FixMyRV
-- Run this SQL in your PostgreSQL database

-- Insert admin user (password: admin123)
-- Password is already bcrypt hashed
INSERT INTO users (
  "firstName", 
  "lastName", 
  email, 
  password, 
  role, 
  verified, 
  type, 
  "plan_type",
  credits,
  "createdAt", 
  "updatedAt"
) VALUES (
  'Admin',
  'User',
  'admin@fixmyrv.com',
  '$2b$10$rBV2kzM5nqZ8qX.YGxJtPuKH7xH3bQZzL8W9dYFqM.LnvPJm5nwKq', -- admin123
  'admin',
  true,
  'pro',
  'subscription',
  1000,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  password = '$2b$10$rBV2kzM5nqZ8qX.YGxJtPuKH7xH3bQZzL8W9dYFqM.LnvPJm5nwKq',
  role = 'admin',
  verified = true,
  type = 'pro';

-- Seed Twilio Settings (configure these with your actual Twilio credentials)
INSERT INTO twilio_settings (
  "accountSid",
  "authToken",
  "phoneNumber",
  "optinMessage",
  "createdAt",
  "updatedAt"
) VALUES (
  'YOUR_TWILIO_ACCOUNT_SID',
  'YOUR_TWILIO_AUTH_TOKEN',
  '+1234567890',
  'Your Phone Number has been associated with a FixMyRV.ai service account. To confirm and Opt-In, please respond "YES" to this message. At any moment you can stop all messages from us, by texting back "STOP".',
  NOW(),
  NOW()
)
ON CONFLICT (id)
DO UPDATE SET
  "accountSid" = 'YOUR_TWILIO_ACCOUNT_SID',
  "authToken" = 'YOUR_TWILIO_AUTH_TOKEN',
  "phoneNumber" = '+1234567890';

-- Verify admin user
SELECT id, email, role, verified, type, credits FROM users WHERE role = 'admin';

-- Verify Twilio settings
SELECT id, "accountSid", "phoneNumber" FROM twilio_settings;
