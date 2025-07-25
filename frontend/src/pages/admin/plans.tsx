import { useEffect, useState, useCallback } from "react";
import CreatePlan from "@/components/admin/plan/createPlan";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import PlanService from "@/services/admin/plan.service";
import { PlanResponse } from "@/types/plan";
import Helpers from "@/config/helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import EditPlan from "@/components/admin/plan/editPlan";
import Pagination from "@/components/pagination";
import { Switch } from "@/components/ui/switch";

const Plans = () => {
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  const fetchPlans = useCallback(
    async (currentPage: number = page, currentPageSize: number = pageSize) => {
      try {
        setIsLoading(true);
        const planService = new PlanService();
        const response = await planService.getAllPlans(
          currentPage,
          currentPageSize
        );
        setPlans(response.plans);
        setTotalItems(response.pagination.total);
      } catch (error) {
        Helpers.toast("error", "Failed to fetch plans");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [page, pageSize]
  );

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleUpdateClick = async (plan: PlanResponse) => {
    try {
      setUpdatingPlanId(plan.id);
      const planService = new PlanService();
      await planService.planStatus(plan.id, !plan.active);
      Helpers.toast("success", "Plan status updated successfully");
      fetchPlans(page, pageSize);
    } catch (error) {
      Helpers.toast("error", "Failed to Updated plan");
      console.error(error);
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const handleEditPlan = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setShowEditPlan(true);
  };

  const handlePlanCreated = () => {
    setShowCreatePlan(false);
    fetchPlans(1, pageSize); // Go back to first page after creating a new plan
  };

  const handlePlanUpdated = () => {
    setShowEditPlan(false);
    fetchPlans(page, pageSize);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPlans(newPage, pageSize);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
    fetchPlans(1, newPageSize);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Plans</h1>
        <Button onClick={() => setShowCreatePlan(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      <Dialog open={showCreatePlan} onOpenChange={setShowCreatePlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Plan</DialogTitle>
          </DialogHeader>
          <CreatePlan onSuccess={handlePlanCreated} />
        </DialogContent>
      </Dialog>

      {showEditPlan && selectedPlan && (
        <Dialog open={showEditPlan} onOpenChange={setShowEditPlan}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
            </DialogHeader>
            <EditPlan plan={selectedPlan} onSuccess={handlePlanUpdated} />
          </DialogContent>
        </Dialog>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Billing Interval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No plans found
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {plan.description}
                  </TableCell>
                  <TableCell>
                    {plan.unitAmount} {plan.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    {plan.interval === null ? "One time" : plan.interval}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={plan.active}
                        onCheckedChange={() => handleUpdateClick(plan)}
                        disabled={updatingPlanId === plan.id}
                      />
                      <span className="text-sm text-muted-foreground">
                        {plan.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditPlan(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        disableNext={page * pageSize >= totalItems}
        hidePaginationNumbers={true}
      />
    </div>
  );
};

export default Plans;
