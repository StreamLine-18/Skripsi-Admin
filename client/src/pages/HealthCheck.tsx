import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { healthApi } from "@/lib/api";
import { Server, HeartPulse, HardDrive, Cpu, AlertCircle, Clock } from "lucide-react";

// Helper function to format seconds into a readable string (e.g., 2d 15h 30m 5s)
function formatUptime(seconds: number) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${d}d ${h}h ${m}m ${s}s`;
}

// A reusable component for displaying a stat
const StatCard = ({ title, value, icon, children }: { title: string, value?: string | number, icon: React.ReactNode, children?: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            {value && <div className="text-2xl font-bold">{value}</div>}
            {children}
        </CardContent>
    </Card>
);

export default function ServerHealth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["serverHealth"],
    queryFn: healthApi.getHealth,
    // Refetch the data every 10 seconds
    refetchInterval: 10000,
  });

  if (isLoading && !data) {
    return (
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold mb-4">Server Health</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
        </div>
        <div className="mt-4">
            <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Failed to connect to the server health endpoint. Please check the API status.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { status, uptime_seconds, system } = data!;
  const isOk = status === "ok";

  return (
    <div className="p-4 md:p-6 space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Server Health</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Status" value={status.toUpperCase()} icon={<HeartPulse className="h-4 w-4 text-muted-foreground" />}>
                <Badge variant={isOk ? "default" : "destructive"} className={isOk ? "bg-emerald-500" : "bg-red-500"}>
                    {isOk ? "Online" : "Offline"}
                </Badge>
            </StatCard>
            <StatCard title="Uptime" value={formatUptime(uptime_seconds)} icon={<Clock className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="CPU Usage" value={`${system.cpu_usage_percent}%`} icon={<Cpu className="h-4 w-4 text-muted-foreground" />} />
            <StatCard title="Memory Usage" icon={<HardDrive className="h-4 w-4 text-muted-foreground" />}>
                <div className="text-2xl font-bold">{system.memory.used_percent}%</div>
                <p className="text-xs text-muted-foreground">
                    {`Used ${Math.round(system.memory.total_mb - system.memory.available_mb)} MB of ${Math.round(system.memory.total_mb)} MB`}
                </p>
                <Progress value={system.memory.used_percent} className="mt-2" />
            </StatCard>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Server className="mr-2"/> System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
                <p><strong className="w-24 inline-block">Platform:</strong> {system.platform}</p>
                <p><strong className="w-24 inline-block">Architecture:</strong> {system.architecture}</p>
                <p><strong className="w-24 inline-block">OS Version:</strong> <span className="font-mono text-xs">{system.platform_version}</span></p>
            </CardContent>
        </Card>
    </div>
  );
}
