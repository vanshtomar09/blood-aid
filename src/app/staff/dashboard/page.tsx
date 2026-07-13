import StatCard from "@/components/stat-card";
import { adminStats, urgentRequests } from "@/lib/data";
import RecentRequestsTable from "@/components/admin/recent-requests-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StaffDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Staff Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's a summary of your operations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <StatCard key={stat.title} stat={stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Recent Urgent Requests</CardTitle>
          <CardDescription>
            A log of all recent critical blood needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentRequestsTable requests={urgentRequests} />
        </CardContent>
      </Card>
    </div>
  );
}
