"use client";

import { useFormState } from "react-dom";
import { useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getPrediction, type PredictionState } from "@/app/predict/actions";
import { Lightbulb, TrendingUp } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

function SubmitButton() {
  const [isPending, startTransition] = useTransition();
  return (
    <Button type="submit" disabled={isPending}>
      {isPending ? "Analyzing..." : "Predict Demand"}
    </Button>
  );
}

export default function PredictionForm() {
  const initialState: PredictionState = {
    message: null,
    errors: null,
    prediction: null,
  };
  const [state, formAction] = useFormState(
    getPrediction,
    initialState
  );
  const isPending = (formAction as any).pending;


  return (
    <form action={formAction as any}>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Prediction Input</CardTitle>
          <CardDescription>
            Provide the necessary data to generate a demand forecast.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="historicalData">Historical Data (CSV format)</Label>
            <Textarea
              id="historicalData"
              name="historicalData"
              placeholder="e.g., Date,A+,A-,B+,B-...\n2023-01-01,10,5,8,3..."
              className="min-h-32"
            />
            {state.errors?.historicalData && (
              <p className="text-sm text-destructive">{state.errors.historicalData[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seasonality">Seasonality Trends</Label>
            <Textarea
              id="seasonality"
              name="seasonality"
              placeholder="e.g., Higher demand during summer holidays, lower in winter..."
            />
             {state.errors?.seasonality && (
              <p className="text-sm text-destructive">{state.errors.seasonality[0]}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="localEvents">Upcoming Local Events</Label>
            <Textarea
              id="localEvents"
              name="localEvents"
              placeholder="e.g., City marathon on Oct 15th, Music festival from Nov 5-7..."
            />
             {state.errors?.localEvents && (
              <p className="text-sm text-destructive">{state.errors.localEvents[0]}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Analyzing..." : "Predict Demand"}
            </Button>
          {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
        </CardFooter>
      </Card>

      {(isPending || state.prediction) && (
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
               <div className="bg-primary/10 p-3 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              <div>
                <CardTitle className="font-headline">Predicted Demand</CardTitle>
                <CardDescription>Forecast for the next month.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
                {isPending && !state.prediction && <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                </div>}
                {state.prediction?.predictedDemand && <p className="whitespace-pre-wrap">{state.prediction.predictedDemand}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="bg-accent/10 p-3 rounded-lg">
                    <Lightbulb className="h-6 w-6 text-accent" />
                </div>
              <div>
                <CardTitle className="font-headline">Recommendations</CardTitle>
                <CardDescription>AI-powered suggestions for stock management.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm">
                 {isPending && !state.prediction && <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                </div>}
                {state.prediction?.recommendations && <p className="whitespace-pre-wrap">{state.prediction.recommendations}</p>}
            </CardContent>
          </Card>
        </div>
      )}
    </form>
  );
}
