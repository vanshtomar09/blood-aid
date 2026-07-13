import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { UrgentRequest } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RecentRequestsTableProps {
  requests: UrgentRequest[];
}

export default function RecentRequestsTable({
  requests,
}: RecentRequestsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Blood Type</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-medium">{request.bloodType}</TableCell>
            <TableCell>{request.location}</TableCell>
            <TableCell>{request.time}</TableCell>
            <TableCell className="text-right">
              <Badge
                variant="outline"
                className={cn(
                  request.status === "Fulfilled" &&
                    "bg-green-100 text-green-800 border-green-200",
                  request.status === "In Progress" &&
                    "bg-blue-100 text-blue-800 border-blue-200",
                  request.status === "Pending" &&
                    "bg-yellow-100 text-yellow-800 border-yellow-200"
                )}
              >
                {request.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
