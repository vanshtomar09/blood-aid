"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Phone, ShieldCheck } from "lucide-react";

export default function StaffRegisterForm() {
  const [step, setStep] = useState(1);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would handle form validation and submission here
    setStep(2);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would verify the OTP
    // On success, redirect to the staff dashboard
    // For now, we'll just simulate a success and enable the dashboard link.
    alert("Verification successful! You can now proceed to the dashboard.");
    setStep(3); // Go to success step
  };


  return (
    <>
      {step === 1 && (
        <form onSubmit={handleFormSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input id="full-name" placeholder="Alex Smith" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="employee-id">Employee ID / Badge No.</Label>
                  <Input id="employee-id" placeholder="EMP-12345" required />
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="hospital-name">Hospital / Blood Bank Name</Label>
              <Input id="hospital-name" placeholder="City General Hospital" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone-number">Phone Number</Label>
              <Input id="phone-number" type="tel" placeholder="+91 98765 43210" required />
            </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Request Verification Code
          </Button>
        </form>
      )}

      {step === 2 && (
         <form onSubmit={handleOtpSubmit} className="grid gap-4">
            <Alert>
                <Phone className="h-4 w-4" />
                <AlertTitle>Enter Verification Code</AlertTitle>
                <AlertDescription>
                    A 6-digit code was sent to your phone number. Please enter it below.
                </AlertDescription>
            </Alert>

            <div className="grid gap-2">
                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                <Input id="otp" placeholder="123456" required />
            </div>
            <Button type="submit" className="w-full">Verify & Create Account</Button>
            <Button variant="link" size="sm" onClick={() => setStep(1)}>Back to registration</Button>
         </form>
      )}

      {step === 3 && (
        <div className="grid gap-4 text-center">
             <Alert variant="default" className="bg-green-50 border-green-200 text-green-900">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <AlertTitle>Account Verified!</AlertTitle>
                <AlertDescription>
                    Your staff account has been created successfully. You can now access the dashboard.
                </AlertDescription>
            </Alert>
            <Button className="w-full" asChild>
                <Link href="/staff/dashboard">Go to Staff Dashboard</Link>
            </Button>
        </div>
      )}
    </>
  );
}
