import bcrypt from "bcryptjs";
import { Router, Request, Response } from "express";
import { sequelize } from "../models/index.js";
import initUserModel from "../models/user.js";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { AuthenticatedRequest, UserUpdateRequest } from "../types/user.js";

const User = initUserModel(sequelize);

class UserController {
  async getUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "internal server error",
      });
    }
  }

  async updateUser(
    req: Request<{ id: string }, {}, UserUpdateRequest>,
    res: Response
  ): Promise<void> {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userInstance = plainToClass(User, req.body);
      const errors = await validate(userInstance as object);
      if (errors.length > 0) {
        res.status(400).json({ error: errors[0].constraints });
        return;
      }

      await user.update(req.body);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "internal server error",
      });
    }
  }

  async deleteUser(req: Request<{ id: string }>, res: Response): Promise<void> {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      await user.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        message:
          error instanceof Error ? error.message : "internal server error",
      });
    }
  }

  async getCredits(req: Request, res: Response): Promise<void> {
    const { id } = (req as AuthenticatedRequest).user;

    try {
        const user = await User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.status(200).json({
            message: 'User credits fetched successfully',
            credits: user.credits
        });
    } catch (error) {
        console.error('Error fetching user credits:', error);
        res.status(500).json({ message: 'Error fetching user credits' });
    }
}
}

export default new UserController();
