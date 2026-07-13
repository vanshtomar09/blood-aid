'use client';

import { useEffect, useRef } from 'react';
import { useFormState } from 'react-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ALL_BLOOD_TYPES } from '@/lib/types';
import { submitRequestAction, type RequestState } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function NewRequestPage() {
  const initialState: RequestState = {
    message: null,
    errors: null,
    success: false,
  };
  const [state, formAction] = useFormState(
    submitRequestAction,
    initialState
  );
  const isPending = (formAction as any).pending;
  const { toast } = useToast();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: 'Request Submitted',
        description: state.message,
      });
      formRef.current?.reset();
      // Optionally redirect user after successful submission
      router.push('/dashboard');
    } else if (state.message && state.errors) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: state.message,
      });
    }
  }, [state, toast, router]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Submit a Blood Request
        </h1>
        <p className="text-muted-foreground">
          Fill out the form below to request blood for a patient.
        </p>
      </div>

      <form action={formAction as any} ref={formRef}>
        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Please provide accurate information to help us process your
              request faster.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="patient-name">Patient's Full Name</Label>
                <Input
                  id="patient-name"
                  name="patient-name"
                  placeholder="John Doe"
                />
                {state.errors?.patientName && (
                  <p className="text-sm text-destructive">
                    {state.errors.patientName[0]}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="contact-number">Contact Number</Label>
                <Input
                  id="contact-number"
                  name="contact-number"
                  type="tel"
                  placeholder="+91 98765 43210"
                />
                 {state.errors?.contactNumber && (
                  <p className="text-sm text-destructive">
                    {state.errors.contactNumber[0]}
                  </p>
                )}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="blood-type">Required Blood Type</Label>
                <Select name="blood-type">
                  <SelectTrigger id="blood-type">
                    <SelectValue placeholder="Select blood type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_BLOOD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {state.errors?.bloodType && (
                  <p className="text-sm text-destructive">
                    {state.errors.bloodType[0]}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="units">Required Units</Label>
                <Input id="units" name="units" type="number" placeholder="e.g., 2" />
                 {state.errors?.units && (
                  <p className="text-sm text-destructive">
                    {state.errors.units[0]}
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Urgency</Label>
              <RadioGroup
                name="urgency"
                defaultValue="routine"
                className="grid grid-cols-3 gap-4"
              >
                <div>
                  <RadioGroupItem
                    value="routine"
                    id="routine"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="routine"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Routine
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="urgent"
                    id="urgent"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="urgent"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Urgent
                  </Label>
                </div>
                <div>
                  <RadioGroupItem
                    value="emergency"
                    id="emergency"
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor="emergency"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-destructive bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive [&:has([data-state=checked])]:border-destructive"
                  >
                    Emergency
                  </Label>
                </div>
              </RadioGroup>
               {state.errors?.urgency && (
                  <p className="text-sm text-destructive">
                    {state.errors.urgency[0]}
                  </p>
                )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hospital-name">Hospital Name & Address</Label>
              <Input
                id="hospital-name"
                name="hospital-name"
                placeholder="City General Hospital, 123 Main St, Anytown"
              />
               {state.errors?.hospitalName && (
                  <p className="text-sm text-destructive">
                    {state.errors.hospitalName[0]}
                  </p>
                )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="e.g., Patient is a minor, scheduled for surgery on..."
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
