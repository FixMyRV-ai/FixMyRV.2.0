import { Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditTrackerProps {
  credits: number  ;
  compact?: boolean;
}

const CreditTracker = ({ credits, compact = false }: CreditTrackerProps) => {

  if (compact) {
    return (
      <div className="text-sm font-medium">
        <span className="font-bold text-orange-500">{credits}</span>
      </div>
    );
  } else {
    return (
      <div className="flex items-center gap-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-cente  gap-3 min-w-[10px]">
                <Coins className="h-5 w-5 text-primary" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-md text-black dark:text-white">
                      {credits}
                    </span>
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col gap-1">
              <p className="font-medium">Credit Balance</p>
              <p className="text-xs">
                {credits} credits remaining
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
};

export default CreditTracker; 