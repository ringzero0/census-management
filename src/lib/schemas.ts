
import { z } from 'zod';
import { ID_PROOF_TYPES, TERRITORIES, EXECUTIVE_REGIONS } from './constants';


export const AuthPageFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});
export type AuthPageFormValues = z.infer<typeof AuthPageFormSchema>;


export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
  role: z.enum(['admin', 'executive'], { required_error: 'Please select a role.' }),
});
export type LoginFormValues = z.infer<typeof LoginFormSchema>;


export const RegisterExecutiveFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  region: z.string().refine(value => EXECUTIVE_REGIONS.includes(value), {
    message: "Invalid region selected.",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});
export type RegisterExecutiveFormValues = z.infer<typeof RegisterExecutiveFormSchema>;


export const CensusEntrySchema = z.object({
  familyHeadName: z.string().min(2, { message: 'Family head name is required.' }),
  numberOfDependents: z.coerce.number().min(0, { message: 'Number of dependents cannot be negative.' }),
  numberOfEducatedMembers: z.coerce.number().min(0, { message: 'Number of educated members cannot be negative.' }),
  numberOfNonEducatedMembers: z.coerce.number().min(0, { message: 'Number of non-educated members cannot be negative.' }),
  idProofType: z.string().refine(value => ID_PROOF_TYPES.includes(value), {
    message: "Invalid ID proof type selected.",
  }),
  idNumber: z.string().min(1, { message: 'ID number is required.' }), 
  territory: z.string().refine(value => TERRITORIES.includes(value), {
    message: "Invalid territory selected.",
  }),
}).refine(
  (data) => {
    return data.numberOfEducatedMembers + data.numberOfNonEducatedMembers <= data.numberOfDependents;
  },
  {
    message: "Total of educated and non-educated members cannot exceed the number of dependents.",
    path: ["numberOfDependents"], 
  }
).superRefine((data, ctx) => {
  const { idProofType, idNumber } = data;

  if (!idNumber) { 
    return;
  }

  switch (idProofType) {
    case 'Aadhaar Card':
      if (!/^\d{12}$/.test(idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Aadhaar ID must be exactly 12 digits (e.g., 123456789012).",
          path: ['idNumber'],
        });
      }
      break;
    case 'PAN Card':
      if (!/^[A-Z]{5}\d{4}[A-Z]{1}$/.test(idNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PAN Card must be in the format LLLLLNNNNL (e.g., ABCDE1234F).",
          path: ['idNumber'],
        });
      }
      break;
    case 'Voter ID':
      if (!/^[A-Z]{3}\d{7}$/.test(idNumber)) { 
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Voter ID must be 3 uppercase letters followed by 7 digits (e.g., ABC1234567).",
          path: ['idNumber'],
        });
      }
      break;
    case 'Driving License':
      if (!/^[A-Z]{2}\d{2}\d{4}\d{5,8}$/.test(idNumber) || idNumber.length < 13 || idNumber.length > 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Driving License must be 13-16 chars. Format: 2 state letters, 2 RTO digits, 4 year digits, 5-8 unique numbers (e.g., KA01202312345).",
          path: ['idNumber'],
        });
      }
      break;
    case 'Passport': 
      if (idNumber.length < 3) { 
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passport ID number should be at least 3 characters.",
          path: ['idNumber'],
        });
      }
      break;
    default:
      break;
  }
});

export type CensusEntryFormValues = z.infer<typeof CensusEntrySchema>;

export interface CensusEntry extends CensusEntryFormValues {
  id: string; 
  submittedByUid: string; 
  submittedByEmail: string; 
  submissionDate: string; 
  lastModifiedDate?: string; 
}

export interface Executive {
  uid: string;
  id: string; 
  name: string;
  email: string;
  region: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'executive';
  region?: string; 
  createdAt: any; 
}

export const UpdateProfileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email().readonly().describe("Email cannot be changed here."),
  region: z.string().optional(), 
}).refine(data => {
  if (data.region !== undefined && data.region !== "" && data.region !== null) { 
    return EXECUTIVE_REGIONS.includes(data.region);
  }
  return true;
}, {
  message: "Invalid region selected.",
  path: ["region"],
});

export type UpdateProfileFormValues = z.infer<typeof UpdateProfileFormSchema>;

    