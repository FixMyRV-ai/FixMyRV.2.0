import { RequestHandler } from "express";
import { User, SourceContent, Chat, sequelize } from "../models/index";
import { Op } from "sequelize";
import StripeController from "./stripe.controller";
import stripe from "stripe";
import transactionRouter from "../routes/transaction.routes";
import TransactionController from "./transaction.controller";

class AdminController {
  getDashboard: RequestHandler = async (req, res) => {
    try {
      // Get total users count
      const totalUsers = await User.count({
        where: {
          role: "user",
        },
      });

      const activeUsers = await User.count({
        where: {
          role: "user",
          verified: true,
        },
      });

      // Get total uploaded files
      const totalFiles = await SourceContent.count({
        where: {
          type: {
            [Op.in]: ["file", "url", "gdrive"],
          },
        },
      });

      // Get files by type
      const webUrls = await SourceContent.count({
        where: {
          type: "url",
        },
      });

      const driveFiles = await SourceContent.count({
        where: {
          type: "gdrive",
        },
      });

      const uploadedFiles = await SourceContent.count({
        where: {
          type: "file",
        },
      });

      // Get total chats
      const totalChats = await Chat.count();

      res.status(200).json({
        totalUsers,
        activeUsers,
        totalFiles,
        webUrls,
        driveFiles,
        uploadedFiles,
        totalChats,
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
  };
  getUsers: RequestHandler = async (req, res) => {
    const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber <= 0 ||
      limitNumber <= 0
    ) {
      res.status(400).json({
        error:
          "Invalid pagination parameters. Page and limit must be positive integers.",
      });
      return;
    }
    const offset = (pageNumber - 1) * limitNumber;
    const users = await User.findAll({
      where: { role: "user" },
      offset,
      limit: limitNumber,
      attributes: {
        include: [
          [
            sequelize.literal(`(
              SELECT COUNT(*)
              FROM "chats"
              WHERE "chats"."userId" = "User"."id"
            )`),
            "chatCount",
          ],
        ],
      },
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      message: "Users fetched successfully",
      data: users,
      pagination: {
        totalItems: users.length,
        totalPages: Math.ceil(users.length / limitNumber),
        currentPage: pageNumber,
        pageSize: limitNumber,
      },
    });
  };
}
export default new AdminController();
