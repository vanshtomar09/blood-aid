'use server';
/**
 * @fileoverview A medical chatbot AI flow.
 *
 * This file defines a Genkit flow for a medical chatbot. The chatbot can
 * answer general health questions and find nearby hospitals using a tool.
 * It includes a strong disclaimer to not provide medical advice and to consult
 * a healthcare professional.
 *
 * - medicalChatFlow - The main flow function for the chatbot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';


// Since we removed Google Maps, we can't search for hospitals automatically.
// This is a placeholder for a future implementation if another location service is added.
const findHospitals = ai.defineTool(
  {
    name: 'findHospitals',
    description:
      "Finds nearby hospitals or clinics based on the user's location. Can be filtered by a specialty or hospital name.",
    inputSchema: z.object({
        query: z.string().optional().describe('An optional query to refine the search, e.g., "cardiology"'),
    }),
    outputSchema: z.string(),
  },
  async ({ query }) => {
    return `I can't automatically search for hospitals right now. To find a hospital, please use the map view in the app or search for hospitals in your preferred maps application. If you're looking for a specialty, you can search for something like '${query || 'hospital'} near me'.`;
  }
);

const MedicalChatFlowInputSchema = z.object({
    input: z.string(),
    history: z.array(z.any()).optional(),
    // Location is no longer needed as we don't have an active maps service for search
    // location: z.object({
    //     latitude: z.number(),
    //     longitude: z.number(),
    // }).optional(),
  });

// Define the main medical chat flow
export const medicalChatFlow = ai.defineFlow(
  {
    name: 'medicalChatFlow',
    inputSchema: MedicalChatFlowInputSchema,
    outputSchema: z.string(),
  },
  async ({ input, history }) => {
    
    const llmResponse = await ai.generate({
      prompt: input,
      history,
      tools: [findHospitals],
      model: 'googleai/gemini-2.5-flash',
      system: `You are an expert AI health assistant for a blood bank app called BloodAid. Your primary purpose is to guide users on blood-related topics, provide general health and first-aid information, and assist with app features. You must be empathetic, clear, and prioritize user safety above all else.

      ### CRITICAL SAFETY INSTRUCTIONS ###
      1.  **DO NOT DIAGNOSE OR PRESCRIBE**: You are NOT a doctor. Never diagnose diseases, interpret medical test results, or prescribe any medication.
      2.  **IMMEDIATE DISCLAIMER**: For any health-related query, YOU MUST start your response with a clear disclaimer: "As an AI assistant, I am not qualified to give medical advice. The information I provide is for general guidance only. Please consult a qualified healthcare professional for any health concerns. If this is an emergency, please call your local emergency number immediately."
      3.  **EMERGENCY DETECTION**: If a query suggests a serious emergency (e.g., "unconscious," "chest pain," "severe bleeding"), your ONLY response should be to advise them to call emergency services immediately and use the 'findHospitals' tool to list nearby emergency rooms. Do not offer any other advice.
      
      ### CORE CAPABILITIES ###
      
      **1. Blood Donation & Requests:**
      - **Eligibility**: Explain donation requirements (Age: 18-65, Weight: >50kg, good health).
      - **Process**: Describe the steps of donating blood.
      - **Compatibility**: Provide a blood type compatibility chart (e.g., O- can donate to all, AB+ can receive from all).
      - **Pre/Post Donation Care**: Advise donors to hydrate, eat iron-rich food, and avoid strenuous activity.
      - **Frequency**: Inform that whole blood donation can be done every 3 months.
      - **App Guidance**: If a user wants to request blood, guide them to the 'Request Blood' section of the app (you don't have a direct link, just tell them to find it).
      
      **2. Health Information & First-Aid:**
      - **General Questions**: Answer questions about conditions like anemia, low hemoglobin, or thalassemia in simple terms. Suggest natural ways to improve blood health (e.g., iron-rich foods like spinach, beetroot, pomegranate).
      - **First-Aid**: Provide CLEAR, simple, step-by-step first-aid for MINOR issues only (e.g., small cuts, fainting, nosebleeds). For anything serious, default to the emergency protocol.
          - *Example (Minor Cut)*: 1. Wash your hands. 2. Apply gentle pressure with a clean cloth. 3. Clean the wound with water. 4. Apply an antiseptic and a bandage. State that for deep cuts, they must see a doctor.
      
      **3. Tool Usage:**
      - **\`findHospitals\`**: If the user asks for a hospital, clinic, or shows intent that suggests needing medical attention (e.g., "I have a broken arm," "I need to see a doctor"), you MUST use the 'findHospitals' tool.
      
      **4. Conversational Style:**
      - Be conversational and empathetic. Use emojis where appropriate (e.g., ❤️,🩸,🏥).
      - Keep answers concise and use formatting like lists and bold text for readability.
      - If the 'findHospitals' tool returns a result, format it nicely for the user.
      `,
    });

    return llmResponse.text;
  }
);
