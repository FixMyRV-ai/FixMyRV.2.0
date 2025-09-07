import React, { useState } from "react";
import Helpers from "@/config/helpers";
import PlanService from "@/services/admin/plan.service";
import { Plan } from "@/types/plan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CreatePlanProps {
  onSuccess?: () => void;
}

const initialPlanState: Plan = {
  id: "",
  priceId: "",
  name: "",
  description: "",
  unitAmount: 0,
  currency: "usd",
  interval: undefined,
  credits: 0,
  active: true,
  features: {},
  metadata: {},
};

const CreatePlan: React.FC<CreatePlanProps> = ({ onSuccess }) => {
  const [plan, setPlan] = useState<Plan>(initialPlanState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePlan = async () => {
    try {
      setIsSubmitting(true);
      const planService = new PlanService();
      if (plan.interval === "one-time") {
        plan.interval = undefined;
      }
      await planService.createPlan(plan);
      Helpers.toast("success", "Plan created successfully");

      // Reset form to initial state
      setPlan(initialPlanState);

      // Call the onSuccess callback to close the dialog
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      Helpers.toast("error", "Failed to create plan");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureChange = (key: string, value: string) => {
    setPlan((prev) => ({
      ...prev,
      features: {
        ...(prev.features || {}),
        [key]: value,
      },
    }));
  };

  const handleRemoveFeature = (key: string) => {
    if (!plan.features) return;

    const newFeatures = { ...plan.features };
    delete newFeatures[key];
    setPlan((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto relative">
      <CardHeader>
        <CardTitle>Create Plan</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[70vh] pr-4">
        <CardContent className="space-y-4 pb-20">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={plan.name}
              onChange={(e) => setPlan({ ...plan, name: e.target.value })}
              placeholder="Enter plan name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={plan.description}
              onChange={(e) =>
                setPlan({ ...plan, description: e.target.value })
              }
              placeholder="Enter plan description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price Amount</Label>
              <Input
                id="price"
                type="number"
                value={plan.unitAmount}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    unitAmount: parseFloat(e.target.value),
                  })
                }
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={plan.currency}
                onValueChange={(value) => setPlan({ ...plan, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interval">Billing Interval</Label>
            <Select
              value={plan.interval}
              onValueChange={(value: "day" | "week" | "month" | "year") =>
                setPlan({ ...plan, interval: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select billing interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Yearly</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="Credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              value={plan.credits}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  credits: parseInt(e.target.value),
                })
              }
              placeholder="0"
              min="0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={plan.active}
              onChange={(e) => setPlan({ ...plan, active: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="active">Active</Label>
          </div>

          <div className="space-y-2">
            <Label>Features</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="new-feature-name"
                  placeholder="Feature name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const featureName = (e.target as HTMLInputElement).value;
                      if (
                        featureName &&
                        plan.features &&
                        !plan.features[featureName]
                      ) {
                        handleFeatureChange(featureName, "");
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById(
                      "new-feature-name"
                    ) as HTMLInputElement;
                    const featureName = input.value;
                    if (
                      featureName &&
                      plan.features &&
                      !plan.features[featureName]
                    ) {
                      handleFeatureChange(featureName, "");
                      input.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {plan.features &&
                Object.entries(plan.features).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <Input value={key} disabled className="flex-1" />
                    <Input
                      value={value}
                      onChange={(e) => handleFeatureChange(key, e.target.value)}
                      placeholder="Feature value"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => handleRemoveFeature(key)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </ScrollArea>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button
          className="w-full"
          onClick={handleCreatePlan}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Plan"}
        </Button>
      </div>
    </Card>
  );
};

export default CreatePlan;
