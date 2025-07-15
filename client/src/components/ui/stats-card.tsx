import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = "neutral", 
  icon: Icon, 
  iconColor 
}: StatsCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-emerald-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${iconColor} rounded-md flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-slate-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
        {change && (
          <div className="bg-slate-50 px-5 py-3 -mx-5 -mb-5 mt-5">
            <div className="text-sm">
              <span className={`font-medium ${getChangeColor()}`}>{change}</span>
              <span className="text-slate-500"> from last month</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
