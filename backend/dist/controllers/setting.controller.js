var _a;
import OpenAI from "openai";
import { Setting, TwilioSetting } from "../models/index.js";
export class SettingController {
}
_a = SettingController;
SettingController.read = async (req, res) => {
    try {
        let result = await Setting.findOne();
        // If no settings exist, create default ones
        if (!result) {
            console.log('No settings found, creating default settings...');
            result = await Setting.create({
                key: '', // Empty API key - user will need to configure
                chatModel: 'gpt-3.5-turbo',
                embeddingModel: 'text-embedding-ada-002',
                outputTokens: 1000,
                systemPrompt: 'You are a helpful AI assistant for RV troubleshooting and maintenance.'
            });
            console.log('✅ Default settings created');
        }
        // Check if API key looks valid before trying to fetch models
        const isValidApiKey = result.key && result.key.startsWith('sk-') && result.key.length > 20 && !result.key.includes('your-openai-api-key-here');
        let models = [];
        if (isValidApiKey) {
            try {
                const client = new OpenAI({
                    apiKey: result.key,
                });
                const modelsList = await client.models.list();
                models = modelsList.data;
            }
            catch (apiError) {
                console.warn('OpenAI API error (using sample key):', apiError.message);
                // Return settings without models if API key is invalid
            }
        }
        res.status(200).json({
            data: result,
            models: models,
        });
    }
    catch (error) {
        console.error('❌ Error in settings read:', error);
        res.status(500).json({ message: error.message || "Error reading resource" });
    }
};
SettingController.update = async (req, res) => {
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
        }
        else {
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
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error updating or creating resource", error });
    }
};
// Twilio Settings Methods
SettingController.readTwilioSettings = async (req, res) => {
    try {
        let result = await TwilioSetting.findOne();
        // If no Twilio settings exist, create default ones
        if (!result) {
            console.log('No Twilio settings found, creating defaults...');
            result = await TwilioSetting.create({
                accountSid: '',
                authToken: '',
                phoneNumber: '',
                optinMessage: 'Thank you for contacting us! Reply STOP to opt out.'
            });
            console.log('✅ Default Twilio settings created');
        }
        res.status(200).json({
            data: result,
        });
    }
    catch (error) {
        console.error('❌ Error in Twilio settings read:', error);
        res.status(500).json({ message: error.message || "Error reading Twilio settings" });
    }
};
SettingController.updateTwilioSettings = async (req, res) => {
    try {
        const { accountSid, authToken, phoneNumber } = req.body;
        // Check if the Twilio settings row exists
        const twilioExist = await TwilioSetting.findOne();
        let result;
        if (twilioExist) {
            // Update the existing row
            twilioExist.accountSid = accountSid;
            twilioExist.authToken = authToken;
            twilioExist.phoneNumber = phoneNumber;
            result = await twilioExist.save();
        }
        else {
            // Create a new row
            result = await TwilioSetting.create({
                accountSid,
                authToken,
                phoneNumber,
            });
        }
        res.status(200).json({ result });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error updating or creating Twilio settings", error });
    }
};
SettingController.updateTwilioOptinMessage = async (req, res) => {
    try {
        const { optinMessage } = req.body;
        // Validate message length (Twilio recommended 320 characters)
        if (optinMessage && optinMessage.length > 320) {
            return res.status(400).json({
                message: "Opt-In message must be 320 characters or less"
            });
        }
        // Check if the Twilio settings row exists
        const twilioExist = await TwilioSetting.findOne();
        let result;
        if (twilioExist) {
            // Update the existing row
            twilioExist.optinMessage = optinMessage;
            result = await twilioExist.save();
        }
        else {
            // Create a new row with default values and opt-in message
            result = await TwilioSetting.create({
                accountSid: '',
                authToken: '',
                phoneNumber: '',
                optinMessage,
            });
        }
        res.status(200).json({ result });
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Error updating Twilio Opt-In message", error });
    }
};
//# sourceMappingURL=setting.controller.js.map