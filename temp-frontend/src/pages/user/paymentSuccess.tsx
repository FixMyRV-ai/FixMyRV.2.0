import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PaymentService from "@/services/user/payment.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { CheckoutSessionDetail } from "@/types/subscription";
import authslice from "@/store/slices/authSlice";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = authslice();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] =
    useState<CheckoutSessionDetail | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("No session ID found");
      setLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const response = await PaymentService.getCheckoutSession(sessionId);
        setSessionDetails(response.data);
      } catch (err) {
        console.error("Error fetching session details:", err);
        setError("Failed to load payment details");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-medium">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error || !sessionDetails) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <CardTitle>Payment Error</CardTitle>
            </div>
            <CardDescription>
              There was a problem processing your payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/upgrade")} className="w-full">
              Try Again
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <CardTitle>Payment Successful</CardTitle>
          </div>
          <CardDescription>Thank you for your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Amount Paid</p>
            <p className="font-medium">
              ${(sessionDetails.amount_total / 100).toFixed(2)}{" "}
              {sessionDetails.currency.toUpperCase()}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          {sessionDetails.subscription && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Subscription ID</p>
              <p className="font-medium">
                {typeof sessionDetails.subscription === "string"
                  ? sessionDetails.subscription
                  : sessionDetails.subscription.id}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/settings/subscription")}
          >
            View Subscription
          </Button>
          <Button onClick={() => navigate("/chat/new")}>
            Continue to chat
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
