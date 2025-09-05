import { useState, useEffect } from "react";
import PaymentService from "@/services/user/payment.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionData } from "@/types/subscription";
import { DialogClose } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";

const SubscriptionDetails = () => {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await PaymentService.getSubscription();
        setSubscription(response.data);
      } catch (err) {
        console.error("Error fetching subscription:", err);
        setError("Failed to load subscription details.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const handleUpgrade = () => {
    navigate("/upgrade");
  };

  const handleCancelSubscription = async () => {
    try {
      await PaymentService.cancelSubscription(subscription?.id as string);
      setShowCancelDialog(false);
      // Refresh subscription data
      const response = await PaymentService.getSubscription();
      setSubscription(response.data);
    } catch (err) {
      console.error("Error canceling subscription:", err);
      setError("Failed to cancel subscription.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-6">
        <AlertCircle className="h-5 w-5" />
        <p>{error}</p>
      </div>
    );
  }

  if (!subscription || !subscription.items?.data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Subscription</CardTitle>
          <CardDescription>Upgrade to access premium features</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade Now
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Subscription Details</CardTitle>
          <CardDescription>
            Manage your subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">
                {subscription.status}
                {subscription.cancel_at_period_end && " (Cancelling)"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium">
                ${subscription.items.data[0].plan.amount / 100}/
                {subscription.items.data[0].plan.interval}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Current Period Start
              </p>
              <p className="font-medium">
                {formatDate(subscription.items.data[0].current_period_start)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Current Period End
              </p>
              <p className="font-medium">
                {formatDate(subscription.items.data[0].current_period_end)}
              </p>
            </div>
            {subscription.cancel_at_period_end && (
              <div className="col-span-2">
                <p className="text-sm text-amber-600">
                  Your subscription will end on{" "}
                  {formatDate(subscription.current_period_end)}. You will not be
                  charged again.
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between">
          <Button
            variant="outline"
            onClick={() => setShowCancelDialog(true)}
            disabled={subscription.cancel_at_period_end}
          >
            {subscription.cancel_at_period_end
              ? "Cancellation Scheduled"
              : "Cancel Subscription"}
          </Button>
          <Button onClick={handleUpgrade}>Change Plan</Button>
        </CardFooter>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>     
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue
              to have access until the end of your current billing period on{" "}
              {formatDate(subscription?.current_period_end)}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep Subscription</Button>
            </DialogClose>
            <Button onClick={handleCancelSubscription} variant="destructive">
              Yes, Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SubscriptionDetails;
