import React, { useState } from "react";
import Helpers from "@/config/helpers";
import PlanService from "@/services/admin/plan.service";
import { Plan, PlanResponse } from "@/types/plan";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EditPlanProps {
  plan: PlanResponse;
  onSuccess: () => void;
}

const EditPlan: React.FC<EditPlanProps> = ({ plan, onSuccess }) => {
  const [editedPlan, setEditedPlan] = useState<Plan>({
    id: plan.id,
    priceId: plan.priceId,
    name: plan.name,
    description: plan.description,
    unitAmount: plan.unitAmount,
    currency: plan.currency,
    interval: plan.interval,
    credits: plan.credits,
    active: plan.active,
    features: plan.features || {},
    metadata: plan.metadata,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdatePlan = async () => {
    try {
      setIsSubmitting(true);
      const planService = new PlanService();
      if (editedPlan.interval === "one-time") {
        editedPlan.interval = undefined;
      }
      await planService.updatePlan(plan.id, editedPlan);
      Helpers.toast("success", "Plan updated successfully");
      onSuccess();
    } catch (error) {
      Helpers.toast("error", "Failed to update plan");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeatureChange = (key: string, value: string) => {
    setEditedPlan((prev) => ({
      ...prev,
      features: {
        ...(prev.features || {}),
        [key]: value,
      },
    }));
  };

  const handleRemoveFeature = (key: string) => {
    if (!editedPlan.features) return;

    const newFeatures = { ...editedPlan.features };
    delete newFeatures[key];
    setEditedPlan((prev) => ({
      ...prev,
      features: newFeatures,
    }));
  };

  return (
    <Card className="w-full max-w-4xl mx-auto relative">
      <CardHeader>
        <CardTitle>Edit Plan</CardTitle>
      </CardHeader>
      <ScrollArea className="h-[70vh] pr-4">
        <CardContent className="space-y-4 pb-20">
          <div className="space-y-2">
            <Label htmlFor="name">Plan Name</Label>
            <Input
              id="name"
              value={editedPlan.name}
              onChange={(e) =>
                setEditedPlan({ ...editedPlan, name: e.target.value })
              }
              placeholder="Enter plan name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedPlan.description}
              onChange={(e) =>
                setEditedPlan({
                  ...editedPlan,
                  description: e.target.value,
                })
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
                value={editedPlan.unitAmount}
                onChange={(e) =>
                  setEditedPlan({
                    ...editedPlan,
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
                value={editedPlan.currency}
                onValueChange={(value) =>
                  setEditedPlan({ ...editedPlan, currency: value })
                }
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
              value={editedPlan.interval || "one-time"}
              onValueChange={(
                value: "day" | "week" | "month" | "year" | "one-time"
              ) => setEditedPlan({ ...editedPlan, interval: value })}
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
            <Label htmlFor="credits">Credits</Label>
            <Input
              id="credits"
              type="number"
              value={editedPlan.credits}
              onChange={(e) =>
                setEditedPlan({
                  ...editedPlan,
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
              checked={editedPlan.active}
              onChange={(e) =>
                setEditedPlan({ ...editedPlan, active: e.target.checked })
              }
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
                        editedPlan.features &&
                        !editedPlan.features[featureName]
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
                      editedPlan.features &&
                      !editedPlan.features[featureName]
                    ) {
                      handleFeatureChange(featureName, "");
                      input.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {editedPlan.features &&
                Object.entries(editedPlan.features).map(([key, value]) => (
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
          onClick={handleUpdatePlan}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Plan"}
        </Button>
      </div>
    </Card>
  );
};

export default EditPlan;
