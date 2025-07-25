import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction, RequestHandler } from "express";

const authMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if token is provided
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization token required" });
    return;
  }

  const token = authHeader.split(" ")[1]; // Extract token from "Bearer <token>"

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;
    req.user = decoded; // Store user data in req.user for further use in controllers
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

export default authMiddleware;
