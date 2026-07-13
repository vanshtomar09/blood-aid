import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
  } from "@/components/ui/card";
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { bloodBanks } from "@/lib/data";
  import { ALL_BLOOD_TYPES } from "@/lib/types";
  import { Droplet, Plus, Minus } from "lucide-react";
  
  export default function InventoryPage() {
    // For demonstration, we'll manage the inventory of the first blood bank.
    // In a real app, this would be determined by the logged-in user.
    const myBankInventory = bloodBanks[0].inventory;
  
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Update real-time blood stock for your center.
          </p>
        </div>
  
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Current Stock Levels</CardTitle>
            <CardDescription>
              View and update the number of available units for each blood type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Blood Type</TableHead>
                  <TableHead>Current Units</TableHead>
                  <TableHead className="w-[250px] text-right">Update Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ALL_BLOOD_TYPES.map((type) => (
                  <TableRow key={type}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Droplet className="h-5 w-5 text-primary" />
                        <span>{type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-lg">{myBankInventory[type]}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" className="h-8 w-8">
                              <Minus className="h-4 w-4" />
                          </Button>
                          <Input type="number" defaultValue={myBankInventory[type]} className="w-20 text-center" />
                           <Button variant="outline" size="icon" className="h-8 w-8">
                              <Plus className="h-4 w-4" />
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
              <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  