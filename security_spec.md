# Security Specification — Mouna Emploi (منى تشغيل)

## 1. Data Invariants & Master Source of Truth

1. **Strict PII Isolation (`/user_pii/{userId}`)**:
   - Contains `fullName`, `email`, `phone`, `cinOrIce`, `companyLegalName`, `exactAddress`.
   - **Invariant**: NEVER readable by other candidates or recruiters. `get` and `list` are strictly restricted to `isOwner(userId) || isAdmin()`.
2. **Anonymized Public Profiles (`/public_profiles/{userId}`)**:
   - Contains only anonymized `aliasCode`, `role`, `titleFr`, `titleAr`, `city`, `skills`, `bioSummary`, `isPremium`, `subscriptionPlan`, `dailyRateMad`, `verified`.
   - **Invariant**: Users cannot self-assign `role == 'admin'` unless `isAdmin()` is true. `uid` must match `userId` and `request.auth.uid`.
3. **Interim Job Offers (`/jobs/{jobId}`)**:
   - **Invariant**: Only verified users (`recruiterId == request.auth.uid`) can create offers, and `exists(/databases/$(database)/documents/public_profiles/$(request.auth.uid))` must hold. Once `status == 'closed'`, non-admins cannot update the offer (Terminal State Locking).
4. **Candidate Applications (`/applications/{applicationId}`)**:
   - **Invariant**: Must reference an existing `/jobs/{jobId}` via `exists()`. Only readable by `candidateId == request.auth.uid`, `recruiterId == request.auth.uid`, or `isAdmin()`. Once `status in ['hired', 'rejected']`, only admins can modify it.
5. **Anonymized Real-Time Chat (`/chats/{threadId}` and `/chats/{threadId}/messages/{messageId}`)**:
   - **Master Gate**: Every message operation in `/chats/{threadId}/messages/{messageId}` fetches `/chats/{threadId}` via `get()` and verifies that `request.auth.uid` is either `candidateId` or `recruiterId` (or `isAdmin()`) AND that the parent thread `status == 'active'`.
6. **Subscriptions (`/subscriptions/{subscriptionId}`)**:
   - **Invariant**: Readable and writable only by `userId == request.auth.uid` or `isAdmin()`.
7. **Push Notifications (`/notifications/{notificationId}`)**:
   - **Invariant**: Created by authenticated verified users (`senderId == request.auth.uid`), readable/updatable only by `recipientId == request.auth.uid` or `isAdmin()`.

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (PII Theft by Recruiter)**: Authenticated recruiter attempts `get(/user_pii/candidate_123)` to steal phone number and CIN. -> `PERMISSION_DENIED`.
2. **Payload 2 (Self-Assigned Admin Role)**: New user creates `/public_profiles/uid_1` with `role: "admin"`. -> `PERMISSION_DENIED`.
3. **Payload 3 (Shadow Field Injection)**: Candidate updates `/public_profiles/uid_1` adding `{ "isSuperRoot": true }`. -> `PERMISSION_DENIED` via `hasOnly()`.
4. **Payload 4 (Unverified Email Admin Spoof)**: Attacker with `email: "developpementistes@gmail.com"` but `email_verified: false` attempts admin read on `/user_pii/any_user`. -> `PERMISSION_DENIED`.
5. **Payload 5 (ID Poisoning / 2KB Path ID)**: Attacker attempts to create document with 500-char ID or invalid regex chars in `/jobs/{jobId}`. -> `PERMISSION_DENIED` via `isValidId()`.
6. **Payload 6 (Orphaned Application Creation)**: Candidate creates `/applications/app_1` referencing a non-existent `jobId: "ghost_job_999"`. -> `PERMISSION_DENIED` via `exists()` check.
7. **Payload 7 (Terminal State Bypass on Application)**: Recruiter tries to update `/applications/app_1` after `status` is already `'rejected'`. -> `PERMISSION_DENIED`.
8. **Payload 8 (Master Gate Chat Intrusion)**: Non-participant user attempts to read or post in `/chats/thread_1/messages/msg_1`. -> `PERMISSION_DENIED` via parent `get()` check.
9. **Payload 9 (Archived Thread Message Write)**: Participant attempts to create a message in `/chats/thread_1/messages/msg_2` when parent `/chats/thread_1` has `status: 'archived'`. -> `PERMISSION_DENIED`.
10. **Payload 10 (Client Timestamp Forgery)**: User attempts to create `/jobs/job_1` with a past or future `createdAt` instead of `request.time`. -> `PERMISSION_DENIED`.
11. **Payload 11 (Immortal Field Mutation)**: Recruiter attempts to change `recruiterId` or `createdAt` on `/jobs/job_1` during an update. -> `PERMISSION_DENIED`.
12. **Payload 12 (Value Poisoning on Array/String Bounds)**: User attempts to update `skills` with 50 elements (exceeding max 15) or `bioSummary` with 5,000 characters. -> `PERMISSION_DENIED`.
