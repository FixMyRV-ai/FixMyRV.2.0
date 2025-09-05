import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();
// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;
// Helper function to check if Stripe is configured
const isStripeConfigured = () => {
    return stripe !== null && !!process.env.STRIPE_SECRET_KEY;
};
// Helper function to handle Stripe not configured
const handleStripeNotConfigured = (res) => {
    return res.status(503).json({
        error: "Payment service not configured",
        message: "Stripe is not properly configured on this server"
    });
};
class PlanController {
    static async createPlan(req, res) {
        if (!isStripeConfigured()) {
            return handleStripeNotConfigured(res);
        }
        try {
            const { name, description, unitAmount, currency, interval, credits = 0, features, metadata, active, } = req.body;
            const stripeMetadata = {
                ...metadata,
                features: JSON.stringify(features),
                credits: credits,
            };
            // Create a plan in Stripe
            const plan = await stripe.products.create({
                name,
                description: description || "",
                active: active,
                metadata: stripeMetadata,
            });
            // Create a price for the plan
            const price = await stripe.prices.create({
                product: plan.id,
                unit_amount: Math.round(unitAmount * 100), // Convert to cents
                currency,
                recurring: unitAmount > 0 ? { interval } : undefined, // Only add recurring if price > 0
            });
            // Set as default price
            await stripe.products.update(plan.id, {
                default_price: price.id,
            });
            // Fetch the complete plan with price data
            const updatedPlan = await stripe.products.retrieve(plan.id, {
                expand: ["default_price"],
            });
            const response = {
                id: updatedPlan.id,
                priceId: price.id,
                name: updatedPlan.name,
                description: updatedPlan.description || "",
                unitAmount: price.unit_amount,
                currency: price.currency,
                recurring: price.recurring ? true : false,
                interval: price.recurring ? price.recurring.interval : null,
                features,
                credits,
                active: updatedPlan.active,
                metadata: updatedPlan.metadata,
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error("Error creating plan:", error);
            // Handle Stripe-specific errors
            if (error instanceof Stripe.errors.StripeError) {
                return res.status(error.statusCode || 500).json({
                    error: error.message,
                    type: error.type,
                    code: error.code,
                    decline_code: error.decline_code,
                    param: error.param,
                });
            }
            // Handle validation errors
            if (error.name === "ValidationError") {
                return res.status(400).json({
                    error: "Validation Error",
                    details: error.message,
                });
            }
            // Handle other types of errors
            res.status(500).json({
                error: "Failed to create plan",
                message: error.message || "An unexpected error occurred",
                type: error.name,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            });
        }
    }
    static async getAllPlans(req, res) {
        if (!isStripeConfigured()) {
            return handleStripeNotConfigured(res);
        }
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            const stripePlans = await stripe.products.list({
                expand: ["data.default_price"],
                limit: limit,
                starting_after: offset > 0 ? offset.toString() : undefined,
            });
            const plans = stripePlans.data.map((plan) => {
                const price = plan.default_price;
                let features = [];
                if (plan.metadata) {
                    if (plan.metadata.features) {
                        try {
                            features = JSON.parse(plan.metadata.features);
                        }
                        catch (e) {
                            console.error("Error parsing features:", e);
                        }
                    }
                }
                return {
                    id: plan.id,
                    priceId: price ? price.id : null,
                    name: plan.name,
                    description: plan.description || "",
                    unitAmount: price && typeof price.unit_amount === "number"
                        ? (price.unit_amount ?? 0) / 100
                        : 0,
                    currency: price?.currency || "usd",
                    recurring: !!price?.recurring,
                    interval: price?.recurring?.interval || null,
                    features,
                    active: plan.active,
                    credits: plan.metadata.credits,
                    metadata: plan.metadata,
                };
            });
            const totalPages = Math.ceil(stripePlans.data.length / limit);
            res.status(200).json({
                plans: plans,
                pagination: {
                    total: stripePlans.data.length,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            });
        }
        catch (error) {
            console.error("Error fetching plans:", error);
            // Handle Stripe-specific errors
            if (error instanceof Stripe.errors.StripeError) {
                return res.status(error.statusCode || 500).json({
                    error: error.message,
                    type: error.type,
                    code: error.code,
                    decline_code: error.decline_code,
                    param: error.param,
                });
            }
            // Handle pagination errors
            if (error.name === "ValidationError") {
                return res.status(400).json({
                    error: "Invalid pagination parameters",
                    details: error.message,
                });
            }
            // Handle other types of errors
            res.status(500).json({
                error: "Failed to fetch plans",
                message: error.message || "An unexpected error occurred",
                type: error.name,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            });
        }
    }
    static async updatePlan(req, res) {
        if (!isStripeConfigured()) {
            return handleStripeNotConfigured(res);
        }
        try {
            const { id } = req.params;
            const { name, description, unitAmount, currency, interval, credits = 0, features, metadata, active, } = req.body;
            if (!id) {
                return res.status(400).json({ error: "Plan ID is required" });
            }
            const stripeMetadata = {
                ...metadata,
                features: JSON.stringify(features),
                credits: credits,
            };
            // Update    in Stripe
            const plan = await stripe.products.update(id, {
                name,
                description: description || "",
                active,
                metadata: stripeMetadata,
            });
            let price = null;
            if (unitAmount !== undefined) {
                price = await stripe.prices.create({
                    product: id,
                    unit_amount: Math.round(unitAmount * 100), // Convert to cents
                    currency,
                    recurring: unitAmount > 0 && interval ? { interval } : undefined,
                });
                // Set as default price
                await stripe.products.update(id, {
                    default_price: price.id,
                });
            }
            // Fetch the updated plan with price data
            const updatedPlan = await stripe.products.retrieve(id, {
                expand: ["default_price"],
            });
            const defaultPrice = updatedPlan.default_price;
            // Return response with consistent property names
            const response = {
                id: updatedPlan.id,
                priceId: price
                    ? price.id
                    : defaultPrice
                        ? defaultPrice.id
                        : null,
                name: updatedPlan.name,
                description: updatedPlan.description || "",
                unitAmount: price
                    ? price.unit_amount
                    : defaultPrice
                        ? defaultPrice.unit_amount
                        : 0,
                currency: price
                    ? price.currency
                    : defaultPrice
                        ? defaultPrice.currency
                        : "usd",
                recurring: price
                    ? !!price.recurring
                    : defaultPrice
                        ? !!defaultPrice.recurring
                        : false,
                interval: price?.recurring?.interval ??
                    defaultPrice?.recurring?.interval ??
                    null,
                features,
                active: updatedPlan.active,
                metadata: updatedPlan.metadata,
            };
            res.json(response);
        }
        catch (error) {
            console.error("Error updating plan:", error);
            // Handle Stripe-specific errors
            if (error instanceof Stripe.errors.StripeError) {
                return res.status(error.statusCode || 500).json({
                    error: error.message,
                    type: error.type,
                    code: error.code,
                    decline_code: error.decline_code,
                    param: error.param,
                });
            }
            // Handle validation errors
            if (error.name === "ValidationError") {
                return res.status(400).json({
                    error: "Validation Error",
                    details: error.message,
                });
            }
            // Handle not found errors
            if (error.statusCode === 404) {
                return res.status(404).json({
                    error: "Plan not found",
                    message: error.message,
                });
            }
            // Handle other types of errors
            res.status(500).json({
                error: "Failed to update plan",
                message: error.message || "An unexpected error occurred",
                type: error.name,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            });
        }
    }
    static async planStatus(req, res) {
        if (!isStripeConfigured()) {
            return handleStripeNotConfigured(res);
        }
        try {
            const { id } = req.params;
            const { active } = req.body;
            const plan = await stripe.products.update(id, {
                active,
            });
            if (!plan) {
                return res.status(404).json({ error: "Plan not found" });
            }
            res.status(204).send();
        }
        catch (error) {
            console.error("Error updating plan status:", error);
            // Handle Stripe-specific errors
            if (error instanceof Stripe.errors.StripeError) {
                return res.status(error.statusCode || 500).json({
                    error: error.message,
                    type: error.type,
                    code: error.code,
                    decline_code: error.decline_code,
                    param: error.param,
                });
            }
            // Handle not found errors
            if (error.statusCode === 404) {
                return res.status(404).json({
                    error: "Plan not found",
                    message: error.message,
                });
            }
            // Handle other types of errors
            res.status(500).json({
                error: "Failed to update plan status",
                message: error.message || "An unexpected error occurred",
                type: error.name,
                stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
            });
        }
    }
}
export default PlanController;
//# sourceMappingURL=plan.controller.js.map