import { useState, useEffect, useRef } from "react";
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
import { Check, Loader2 } from "lucide-react";
import { Plan } from "@/types/plan";
import { SubscriptionData } from "@/types/subscription";
import ChatHeader, { ChatHeaderRef } from "@/components/chat/chatHeader";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import Helpers from "@/config/helpers";
import { AxiosError } from "axios";
import {
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogContent,
} from "@/components/ui/dialog";
import { Dialog } from "@radix-ui/react-dialog";

const Subscription = () => {
  const [products, setProducts] = useState<Plan[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] =
    useState<SubscriptionData | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const headerRef = useRef<ChatHeaderRef>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsResponse, subscriptionResponse] = await Promise.all([
          PaymentService.getPlans(),
          PaymentService.getSubscription(),
        ]);
        setProducts(productsResponse.data);
        setCurrentSubscription(subscriptionResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubscribe = async (product: Plan) => {
    try {
      setLoading(true);
      setSelectedProduct(product);
      if (!product.priceId) {
        throw new Error("Price ID is required");
      }

      const session = await PaymentService.createCheckoutSession(
        product.priceId
      );

      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error("Error fetching data:", err);
        Helpers.toast(
          "error",
          err.response?.data?.error || "An error occurred"
        );
      } else {
        // console.error("Unknown error:", err);
        Helpers.toast("error", "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleCancelSubscription = async () => {
    try {
      await PaymentService.cancelSubscription(
        currentSubscription?.id as string
      );
      setShowCancelDialog(false);

      const response = await PaymentService.getSubscription();
      setCurrentSubscription(response.data);
    } catch (err) {
      console.error("Error canceling subscription:", err);
      Helpers.toast("error", "Failed to cancel subscription.");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  // Get current product ID safely
  const currentProductId = currentSubscription?.items?.data?.[0]?.plan?.product;

  return (
    <div className="container mx-auto px-4 py-4">
      <ChatHeader
        ref={headerRef}
        isCollapsed={isCollapsed}
        onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
      />
      {currentSubscription && currentSubscription.items?.data?.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>
              Your subscription is {currentSubscription.status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-medium">
                  ${currentSubscription.items.data[0].plan.amount / 100}/
                  {currentSubscription.items.data[0].plan.interval}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="font-medium">
                  {formatDate(
                    currentSubscription.items.data[0].current_period_end
                  )}
                </p>
              </div>
              {currentSubscription.cancel_at_period_end && (
                <div className="col-span-2">
                  <p className="text-sm text-amber-600 font-medium">
                    Your subscription will end on{" "}
                    {formatDate(
                      currentSubscription.items.data[0].current_period_end
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col md:flex-row gap-2 md:gap-0 justify-between">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(true)}
              disabled={currentSubscription.cancel_at_period_end}
            >
              {currentSubscription.cancel_at_period_end
                ? "Cancellation Scheduled"
                : "Cancel Subscription"}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          {currentSubscription ? "Change Plan" : "Choose a Plan"}
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {currentSubscription
            ? "Select a new plan to upgrade or downgrade your subscription"
            : "Choose the perfect plan for your needs. All plans include access to our premium features."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {products.map((product) => {
          const isCurrentProduct = currentProductId === product.id;
          return (
            <Card
              key={product.id}
              className={`flex flex-col transition-all duration-300 hover:shadow-lg ${
                isCurrentProduct ? "border-primary" : ""
              }`}
            >
              <CardHeader>
                <CardTitle className="text-2xl">
                  {product.name}
                  {isCurrentProduct && (
                    <span className="ml-2 text-sm text-primary">(Current)</span>
                  )}
                </CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${product.unitAmount.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    /{product.interval === null ? "One time" : product.interval}
                  </span>
                </div>

                <div className="space-y-3">
                  {product.features &&
                    typeof product.features === "object" &&
                    Object.entries(product.features).map(([key, value]) => (
                      <div key={key} className="flex items-start">
                        <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        <span>{value as string}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSubscribe(product)}
                  className={`w-full ${
                    isCurrentProduct
                      ? "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                      : "bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90"
                  }`}
                  size="lg"
                  disabled={loading || isCurrentProduct}
                >
                  {loading && selectedProduct?.id === product.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : isCurrentProduct ? (
                    "Current Plan"
                  ) : (
                    <>
                      {product.interval === null
                        ? `Payment for ${product.name}`
                        : `Subscribe to ${product.name}`}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll continue
              to have access until the end of your current billing period on{" "}
              {formatDate(currentSubscription?.current_period_end as number)}.
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
    </div>
  );
};

export default Subscription;
