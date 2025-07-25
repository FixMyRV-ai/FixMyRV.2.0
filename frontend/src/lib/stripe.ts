import { loadStripe } from "@stripe/stripe-js";

// Replace with your Stripe publishable key
const stripePromise = loadStripe(
  "pk_test_51QSvjmCIIdlgrt8vYQDgIcXjMFdbw4GveGBT6ob15ICaLCBOnsWETojtwtIm4VGCt34GIZRq3D7TW29mlRZGKF1Q00c4KwqmnQ"
);

export default stripePromise;
