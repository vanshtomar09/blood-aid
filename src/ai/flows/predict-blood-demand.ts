'use server';

/**
 * @fileOverview AI-powered blood demand prediction flow.
 *
 * - predictBloodDemand - Predicts future blood demand based on historical data, seasonality, and local events.
 * - PredictBloodDemandInput - The input type for the predictBloodDemand function.
 * - PredictBloodDemandOutput - The return type for the predictBloodDemand function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictBloodDemandInputSchema = z.object({
  historicalData: z.string().describe('Historical blood demand data in CSV format.'),
  seasonality: z.string().describe('Seasonality information (e.g., monthly trends).'),
  localEvents: z.string().describe('Information about upcoming local events that may impact demand.'),
});

export type PredictBloodDemandInput = z.infer<typeof PredictBloodDemandInputSchema>;

const PredictBloodDemandOutputSchema = z.object({
  predictedDemand: z.string().describe('Predicted blood demand for the next month, including confidence intervals.'),
  recommendations: z.string().describe('Recommendations for managing blood stock levels.'),
});

export type PredictBloodDemandOutput = z.infer<typeof PredictBloodDemandOutputSchema>;

export async function predictBloodDemand(input: PredictBloodDemandInput): Promise<PredictBloodDemandOutput> {
  return predictBloodDemandFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictBloodDemandPrompt',
  input: {schema: PredictBloodDemandInputSchema},
  output: {schema: PredictBloodDemandOutputSchema},
  prompt: `You are an expert in predicting blood demand for blood banks.

  Analyze the following data to predict blood demand for the next month, including confidence intervals, and provide recommendations for managing blood stock levels.

  Historical Data: {{{historicalData}}}
  Seasonality: {{{seasonality}}}
  Local Events: {{{localEvents}}}

  Format your response as follows:
  Predicted Demand: <predicted demand for each blood type>
  Recommendations: <recommendations for managing blood stock levels>
  `,
});

const predictBloodDemandFlow = ai.defineFlow(
  {
    name: 'predictBloodDemandFlow',
    inputSchema: PredictBloodDemandInputSchema,
    outputSchema: PredictBloodDemandOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
