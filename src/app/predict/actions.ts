"use server";

import { predictBloodDemand } from "@/ai/flows/predict-blood-demand";
import { z } from "zod";

const schema = z.object({
  historicalData: z.string().min(1, { message: "Historical data is required." }),
  seasonality: z.string().min(1, { message: "Seasonality information is required." }),
  localEvents: z.string().min(1, { message: "Local events information is required." }),
});

export type PredictionState = {
  message?: string | null;
  errors?: {
    historicalData?: string[];
    seasonality?: string[];
    localEvents?: string[];
  } | null;
  prediction?: {
    predictedDemand: string;
    recommendations: string;
  } | null;
};

export async function getPrediction(prevState: PredictionState, formData: FormData): Promise<PredictionState> {
  const validatedFields = schema.safeParse({
    historicalData: formData.get("historicalData"),
    seasonality: formData.get("seasonality"),
    localEvents: formData.get("localEvents"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check the fields.",
      prediction: null,
    };
  }
  
  try {
    const result = await predictBloodDemand(validatedFields.data);
    return {
      message: "Prediction successful.",
      prediction: result,
      errors: null,
    };
  } catch (error) {
    console.error(error);
    return {
      message: "An error occurred during prediction.",
      prediction: null,
      errors: null,
    };
  }
}
