export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface PublicProfile {
  id: string;
  uid: string;
  aliasCode: string;
  role: UserRole;
  titleFr: string;
  titleAr: string;
  city: string;
  experienceYears: number;
  availability: 'immediate' | 'notice_15d' | 'on_mission';
  skills: string[];
  bioSummary: string;
  isPremium: boolean;
  subscriptionPlan: 'free' | 'pro_candidate' | 'pro_recruiter' | 'enterprise';
  dailyRateMad: number;
  verified: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPII {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  cinOrIce: string;
  companyLegalName: string;
  exactAddress: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface JobOffer {
  id: string;
  recruiterId: string;
  recruiterAlias: string;
  titleFr: string;
  titleAr: string;
  sector: string;
  city: string;
  contractType: 'interim_mission' | 'cdd_interim' | 'pre_embauche';
  durationWeeks: number;
  salaryMad: number;
  requiredSkills: string[];
  descriptionFr: string;
  descriptionAr: string;
  isPriority: boolean;
  status: 'open' | 'filled' | 'closed';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Application {
  id: string;
  jobId: string;
  jobTitleFr: string;
  jobTitleAr: string;
  candidateId: string;
  candidateAlias: string;
  recruiterId: string;
  recruiterAlias: string;
  matchScore: number;
  isPriority: boolean;
  status: 'pending' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  coverNote: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatThread {
  id: string;
  jobId: string;
  jobTitleFr: string;
  candidateId: string;
  candidateAlias: string;
  recruiterId: string;
  recruiterAlias: string;
  lastMessagePreview: string;
  status: 'active' | 'archived';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderAlias: string;
  content: string;
  redactedFlag: boolean;
  createdAt?: unknown;
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userAlias: string;
  planId: 'pro_candidate' | 'pro_recruiter' | 'enterprise';
  amountMad: number;
  billingCycle: 'monthly';
  status: 'active' | 'cancelled';
  paymentMethodLast4: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PushNotification {
  id: string;
  recipientId: string;
  senderId: string;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  category: 'match' | 'application' | 'message' | 'subscription';
  read: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
