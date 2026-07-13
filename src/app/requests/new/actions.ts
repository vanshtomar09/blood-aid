'use server';

import { z } from 'zod';
import { ALL_BLOOD_TYPES } from '@/lib/types';

const RequestSchema = z.object({
  patientName: z.string().min(3, { message: 'Patient name must be at least 3 characters.' }),
  contactNumber: z.string().min(10, { message: 'Please enter a valid contact number.' }),
  bloodType: z.enum(ALL_BLOOD_TYPES),
  units: z.coerce.number().min(1, { message: 'Please enter a valid number of units.' }),
  urgency: z.enum(['routine', 'urgent', 'emergency']),
  hospitalName: z.string().min(3, { message: 'Hospital name is required.' }),
  notes: z.string().optional(),
});

export type RequestState = {
  message?: string | null;
  errors?: {
    patientName?: string[];
    contactNumber?: string[];
    bloodType?: string[];
    units?: string[];
    urgency?: string[];
    hospitalName?: string[];
    notes?: string[];
  } | null;
  success?: boolean;
};

export async function submitRequestAction(
  prevState: RequestState,
  formData: FormData
): Promise<RequestState> {
  const validatedFields = RequestSchema.safeParse({
    patientName: formData.get('patient-name'),
    contactNumber: formData.get('contact-number'),
    bloodType: formData.get('blood-type'),
    units: formData.get('units'),
    urgency: formData.get('urgency'),
    hospitalName: formData.get('hospital-name'),
    notes: formData.get('notes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Validation failed. Please check the fields.',
      success: false,
    };
  }

  // In a real application, you would save this data to your database.
  // For this example, we'll just simulate a successful submission.
  console.log('New Blood Request Submitted:', validatedFields.data);

  return {
    message: 'Your blood request has been submitted successfully. We will contact you shortly.',
    success: true,
  };
}
