import { User } from "../models/index.js";
import nodemailer, { TransportOptions } from "nodemailer";
import dotenv from "dotenv";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthenticatedRequest, User as UserType } from "../types/user.js";
import { Op, Model as SequelizeModel } from "sequelize";
import { register } from "module";
import emailService from "../services/email.service.js";

type UserModel = UserType & SequelizeModel;
import Stripe from "stripe";

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY as string)
  : null;

dotenv.config();

const authController = {
  async sendConfirmationEmail(user: any) {
    // Check if email configuration is available
    if (!process.env.MAIL_HOST || !process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
      console.warn("⚠️ Email configuration not found, skipping confirmation email");
      // Still set verification token for manual verification if needed
      const token = String(crypto.randomBytes(32).toString("hex"));
      user.verificationToken = token;
      await user.save();
      return;
    }

    const token = String(crypto.randomBytes(32).toString("hex")); // Generate a unique token
    const verificationUrl = `${process.env.BACKEND_API_URL}/auth/verify-email?token=${token}&email=${user.email}`;
    // Store the token in the user record for later verification (you might want to add a new field in your User model)
    user.verificationToken = token; // Make sure to update your User model to store this token
    await user.save();

    const emailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        :root {
            --gradient-start: hsl(210 40% 98%);
            --gradient-middle: hsl(210 40% 96.1%);
            --gradient-end: hsl(210 40% 94.1%);
            --background: hsl(0 0% 100%);
            --foreground: hsl(222.2 84% 4.9%);
            --card: hsl(0 0% 100%);
            --card-foreground: hsl(222.2 84% 4.9%);
            --primary: hsl(221.2 83.2% 53.3%);
            --primary-foreground: hsl(210 40% 98%);
            --muted: hsl(210 40% 96.1%);
            --muted-foreground: hsl(215.4 16.3% 46.9%);
            --border: hsl(214.3 31.8% 91.4%);
            --radius: 0.75rem;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--foreground);
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-middle), var(--gradient-end));
        }

        .email-container {
            background-color: var(--card);
            border-radius: var(--radius);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            text-align: center;
            border: 1px solid var(--border);
        }

        .email-header {
            background: linear-gradient(135deg, var(--primary), var(--primary-foreground));
            color: var(--primary-foreground);
            padding: 20px;
            border-radius: var(--radius) var(--radius) 0 0;
            margin: -30px -30px 20px;
        }

        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .verify-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: var(--primary);
            color: var(--primary-foreground) !important;
            text-decoration: none;
            border-radius: var(--radius);
            font-weight: 600;
            margin-top: 20px;
            transition: all 0.2s ease-in-out;
        }

        .verify-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
            font-size: 14px;
            color: var(--muted-foreground);
        }

        .footer a {
            color: var(--primary);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .verification-link {
            word-break: break-all;
            background-color: var(--muted);
            padding: 12px;
            border-radius: var(--radius);
            margin-top: 15px;
            font-size: 12px;
            color: var(--muted-foreground);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --gradient-start: hsl(220 13% 18%);
                --gradient-middle: hsl(220 13% 16%);
                --gradient-end: hsl(220 13% 14%);
                --background: hsl(220 13% 18%);
                --foreground: hsl(220 13% 95%);
                --card: hsl(220 13% 18%);
                --card-foreground: hsl(220 13% 95%);
                --primary: hsl(220 13% 95%);
                --primary-foreground: hsl(220 13% 18%);
                --muted: hsl(220 13% 22%);
                --muted-foreground: hsl(220 13% 65%);
                --border: hsl(220 13% 22%);
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Fix My RV</h1>
        </div>
        
        <h2>Welcome Aboard!</h2>
        
        <p>Thank you for joining Fix My RV. To get started and secure your account, please verify your email address by clicking the button below.</p>
        
        <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
        
        <p>If you didn't create an account, you can safely ignore this email.</p>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Fix My RV. All rights reserved.</p>
            <p>If you're having trouble, copy and paste this link into your browser:</p>
            <div class="verification-link">${verificationUrl}</div>
        </div>
    </div>
</body>
</html>`;

    try {
      await emailService.sendEmail(
        user.email,
        "Verify Your Email - Fix My RV",
        emailTemplate
      );
    } catch (error: any) {
      console.error("Error sending email:", error);
      throw new Error(`Error sending email: ${error.message}`);
    }
  },

  register: (async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, password }: UserType = req.body;

    // Validate password length
    try {
      // Check if email already exists
      const user: UserModel | null = await User.findOne({ where: { email } });
      if (user) {
        return res.status(400).json({ message: "Email is already in use." });
      }

      // Create the user
      const newUser: UserModel = await User.create({
        firstName: firstName,
        lastName: lastName,
        email,
        password,
      });

      // create stripe customer id (only if stripe is configured)
      if (stripe) {
        const customer = await stripe.customers.create({
          name: `${firstName} ${lastName}`,
          email,
        });

        // Update user with Stripe customer ID
        await newUser.update({ stripeCustomerId: customer.id });
      }

      // Send confirmation email
      await authController.sendConfirmationEmail(newUser);

      // Send success response
      res.status(201).json({
        message:
          "Signed up successfully. Please check your email for verification.",
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      next(error);
    }
  }) as RequestHandler,

  verifyEmail: (async (req: Request, res: Response, next: NextFunction) => {
    const { token, email } = req.query;

    try {
      // Find the user with the given email and token
      const user: UserModel | null = await User.findOne({
        where: { email, verificationToken: token },
      });

      if (!user) {
        return res.status(400).send(`
                    <html>
                    <head>
                        <title>Email Verification Failed</title>
                        <style>
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                                background-color: #121212;
                                color: #e0e0e0;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .container {
                                background-color: #1e1e1e;
                                padding: 2rem;
                                border-radius: 8px;
                                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
                                text-align: center;
                                max-width: 400px;
                            }
                            .error-icon {
                                color: #d32f2f;
                                font-size: 48px;
                                margin-bottom: 1rem;
                            }
                            h1 {
                                color: #d32f2f;
                                margin-bottom: 1rem;
                            }
                            p {
                                margin-bottom: 1.5rem;
                                line-height: 1.5;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="error-icon">❌</div>
                            <h1>Verification Failed</h1>
                            <p>Invalid or expired verification link. Please request a new verification email.</p>
                        </div>
                    </body>
                    </html>
                `);
      }

      await user.update({
        verified: true,
        verificationToken: null,
      });
      res.redirect(`${process.env.FRONTEND_URL}/login`);
    } catch (error) {
      console.error("Error verifying email:", error);
      next(error);
    }
  }) as RequestHandler,

  login: (async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: UserType = req.body;

    try {
      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Invalid email format",
        });
      }

      const user: UserModel | null = await User.findOne({
        where: { email },
      });

      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (!user.password) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      if (!user.verified) {
        return res.status(403).json({
          message: "Please verify your email before log in",
          needsVerification: true,
        });
      }

      const isMatch = await bcrypt.compare(
        password as string,
        user.password as string
      );

      if (!isMatch) {
        return res.status(401).json({
          message: "Invalid email or password",
        });
      }

      // Check if Stripe customer exists in local DB (only if stripe is configured)
      if (stripe && !user.stripeCustomerId) {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        });

        // Update user with Stripe customer ID
        await user.update({ stripeCustomerId: customer.id });
        // Refresh user data to get the updated stripeCustomerId
        await user.reload();
      } else if (stripe && user.stripeCustomerId) {
        // Verify if customer exists on Stripe
        try {
          await stripe.customers.retrieve(user.stripeCustomerId);
        } catch (error) {
          // If customer doesn't exist on Stripe, create a new one
          const customer = await stripe.customers.create({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
          });

          // Update user with new Stripe customer ID
          await user.update({ stripeCustomerId: customer.id });
          // Refresh user data to get the updated stripeCustomerId
          await user.reload();
        }
      }

      // Generate access token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          credits: user.credits,
          type: user.type,
          stripeCustomerId: user.stripeCustomerId,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: "24h" }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET as string,
        { expiresIn: "7d" }
      );

      // Save refresh token to database
      await user.update({ refreshToken });

      // Remove sensitive data from response
      const userResponse = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        verified: user.verified,
        role: user.role,
        credits: user.credits,
        plan_type: user.plan_type,
        profileImage: user.profileImage,
        type: user.type,
      };

      res.status(200).json({
        message: "Login successful",
        user: userResponse,
        token,
        refreshToken,
      });
    } catch (error: any) {
      console.error("Error logging in:", error);

      // Handle specific database errors
      if (error.name === "SequelizeConnectionError") {
        return res.status(503).json({
          message: "Service temporarily unavailable. Please try again later.",
        });
      }

      // Handle JWT errors
      if (error.name === "JsonWebTokenError") {
        return res.status(500).json({
          message: "Error generating authentication token",
        });
      }

      // Handle other errors
      next(error);
    }
  }) as RequestHandler,

  forgotPassword: (async (req: Request, res: Response, next: NextFunction) => {
    const { email }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${user.email}`;

      // Set token and expiry (1 hour)
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      const emailTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        :root {
            --gradient-start: hsl(210 40% 98%);
            --gradient-middle: hsl(210 40% 96.1%);
            --gradient-end: hsl(210 40% 94.1%);
            --background: hsl(0 0% 100%);
            --foreground: hsl(222.2 84% 4.9%);
            --card: hsl(0 0% 100%);
            --card-foreground: hsl(222.2 84% 4.9%);
            --primary: hsl(221.2 83.2% 53.3%);
            --primary-foreground: hsl(210 40% 98%);
            --muted: hsl(210 40% 96.1%);
            --muted-foreground: hsl(215.4 16.3% 46.9%);
            --border: hsl(214.3 31.8% 91.4%);
            --radius: 0.75rem;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: var(--foreground);
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-middle), var(--gradient-end));
        }

        .email-container {
            background-color: var(--card);
            border-radius: var(--radius);
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            text-align: center;
            border: 1px solid var(--border);
        }

        .email-header {
            background: linear-gradient(135deg, var(--primary), var(--primary-foreground));
            color: var(--primary-foreground);
            padding: 20px;
            border-radius: var(--radius) var(--radius) 0 0;
            margin: -30px -30px 20px;
        }

        .email-header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }

        .reset-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: var(--primary);
            color: var(--primary-foreground) !important;
            text-decoration: none;
            border-radius: var(--radius);
            font-weight: 600;
            margin-top: 20px;
            transition: all 0.2s ease-in-out;
        }

        .reset-button:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }

        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
            font-size: 14px;
            color: var(--muted-foreground);
        }

        .footer a {
            color: var(--primary);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        .reset-link {
            word-break: break-all;
            background-color: var(--muted);
            padding: 12px;
            border-radius: var(--radius);
            margin-top: 15px;
            font-size: 12px;
            color: var(--muted-foreground);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --gradient-start: hsl(220 13% 18%);
                --gradient-middle: hsl(220 13% 16%);
                --gradient-end: hsl(220 13% 14%);
                --background: hsl(220 13% 18%);
                --foreground: hsl(220 13% 95%);
                --card: hsl(220 13% 18%);
                --card-foreground: hsl(220 13% 95%);
                --primary: hsl(220 13% 95%);
                --primary-foreground: hsl(220 13% 18%);
                --muted: hsl(220 13% 22%);
                --muted-foreground: hsl(220 13% 65%);
                --border: hsl(220 13% 22%);
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>Fix My RV</h1>
        </div>
        
        <h2>Password Reset Request</h2>
        
        <p>You requested a password reset. Click the button below to reset your password:</p>
        
        <a href="${resetUrl}" class="reset-button">Reset Password</a>
        
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Fix My RV. All rights reserved.</p>
            <p>If you're having trouble, copy and paste this link into your browser:</p>
            <div class="reset-link">${resetUrl}</div>
        </div>
    </div>
</body>
</html>`;

      await emailService.sendEmail(
        user.email,
        "Password Reset - Fix My RV",
        emailTemplate
      );
      res.status(200).json({ message: "Password reset email sent" });
    } catch (error: any) {
      console.error("Error in forgotPassword:", error);
      next(error);
    }
  }) as RequestHandler,

  resetPassword: (async (req: Request, res: Response, next: NextFunction) => {
    const { token, email, newPassword }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findOne({
        where: {
          email,
          resetPasswordToken: token,
          resetPasswordExpires: { [Op.gt]: Date.now() },
        },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Update password and clear reset fields
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      next(error);
    }
  }) as RequestHandler,

  resendVerification: (async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { email }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.verified) {
        return res.status(400).json({ message: "Account is already verified" });
      }

      await authController.sendConfirmationEmail(user);
      res.status(200).json({ message: "Verification email resent" });
    } catch (error) {
      console.error("Error in resendVerification:", error);
      next(error);
    }
  }) as RequestHandler,

  changePassword: (async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword }: UserType = req.body;
    const userId = (req as unknown as AuthenticatedRequest).user.id;

    try {
      const user: UserModel | null = await User.findByPk(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isMatch = await bcrypt.compare(
        currentPassword as string,
        user.password as string
      );
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error in changePassword:", error);
      next(error);
    }
  }) as RequestHandler,

  updateProfile: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const { firstName, lastName, email, profileImage }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if email is being changed and if it's already in use
      if (email && email !== user.email) {
        const existingUserWithEmail: UserModel | null = await User.findOne({
          where: { email },
        });
        if (existingUserWithEmail) {
          return res.status(400).json({ message: "Email is already in use" });
        }
      }

      // Prepare update data
      const updateData: UserType = {
        firstName: firstName,
        lastName: lastName,
        email: email,
      };

      // Handle profile image if present
      if (profileImage) {
        const base64Data = profileImage.split(";base64,").pop();
        if (!base64Data) {
          return res.status(400).json({ message: "Invalid image data" });
        }
        // Generate unique filename
        const filename = `${Date.now()}-${userId}.png`;
        const filePath = `uploads/profiles/${filename}`;

        // Ensure directory exists
        if (!fs.existsSync("uploads/profiles")) {
          fs.mkdirSync("uploads/profiles", { recursive: true });
        }

        // Save the file
        fs.writeFileSync(filePath, base64Data as string, {
          encoding: "base64",
        });

        // Create the full URL for the profile image
        const imageUrl = `${process.env.BACKEND_BASE_URL}/${filePath}`;
        updateData.profileImage = imageUrl;
      }

      // Update user
      await user.update(updateData);

      // Return updated user data
      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          profileImage: user.profileImage,
          verified: user.verified,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      next(error);
    }
  }) as RequestHandler,

  verifyPassword: (async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as unknown as AuthenticatedRequest).user.id;
    const { password }: UserType = req.body;

    try {
      const user: UserModel | null = await User.findByPk(userId);
      if (!user || !user.password) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(
        password as string,
        user.password as string
      );

      res.status(200).json({
        isValid: isMatch,
        message: isMatch ? "Password is valid" : "Password is invalid",
      });
    } catch (error: any) {
      console.error("Error verifying password:", error);
      next(error);
    }
  }) as RequestHandler,
};

export default authController;
