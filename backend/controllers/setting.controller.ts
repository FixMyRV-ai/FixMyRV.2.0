import OpenAI from "openai";
import { Setting } from "../models/index";

export class SettingController {
  static read = async (req: any, res: any) => {
    try {
      const result = await Setting.findOne();
      if (!result) {
        return res.status(404).json({ message: "API configuration not found" });
      }
      const client = new OpenAI({
        apiKey: result.key,
      });
     const models = await client.models.list();

      res.status(200).json({
        data:result,
        models:models.data,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Error reading resource" });
    }
  };

  static update = async (req: any, res: any) => {
    try {
      const { key, chatModel, embeddingModel, outputTokens, systemPrompt } = req.body;

      // Check if the openai row exists
      const apiExist = await Setting.findOne();
      let result;

      if (apiExist) {
        // Update the existing row
        apiExist.key = key;
        apiExist.chatModel = chatModel;
        apiExist.embeddingModel = embeddingModel;
        apiExist.outputTokens = outputTokens;
        apiExist.systemPrompt = systemPrompt;
        result = await apiExist.save();
      } else {
        // Create a new row
        result = await Setting.create({
          key,
          chatModel,
          embeddingModel,
          outputTokens,
          systemPrompt,
        });
      }

      res.status(200).json({ result });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating or creating resource", error });
    }
  };
}
