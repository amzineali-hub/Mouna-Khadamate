/**
 * Firestore Security Rules Verification Suite — Dirty Dozen Payloads
 */
export interface DirtyPayloadTest {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: DirtyPayloadTest[] = [
  { id: 1, name: 'PII Theft by Recruiter', collection: 'user_pii', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 2, name: 'Self-Assigned Admin Role', collection: 'public_profiles', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 3, name: 'Shadow Field Injection', collection: 'public_profiles', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 4, name: 'Unverified Email Admin Spoof', collection: 'user_pii', operation: 'get', expectedResult: 'PERMISSION_DENIED' },
  { id: 5, name: 'ID Poisoning Guard', collection: 'jobs', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 6, name: 'Orphaned Application Creation', collection: 'applications', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 7, name: 'Terminal State Bypass on Application', collection: 'applications', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 8, name: 'Master Gate Chat Intrusion', collection: 'chats/thread_1/messages', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 9, name: 'Archived Thread Message Write', collection: 'chats/thread_1/messages', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 10, name: 'Client Timestamp Forgery', collection: 'jobs', operation: 'create', expectedResult: 'PERMISSION_DENIED' },
  { id: 11, name: 'Immortal Field Mutation', collection: 'jobs', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
  { id: 12, name: 'Value Poisoning on Array/String Bounds', collection: 'public_profiles', operation: 'update', expectedResult: 'PERMISSION_DENIED' },
];
