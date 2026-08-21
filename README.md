# GharKhata

GharKhata is a mobile-first Expo app for homeowners tracking construction spend, budgets, bills, vendors, and stages.

## What is included

- Firebase email/password authentication, password reset, persistent native sessions
- Collaborative projects with admin, editor, and viewer roles
- Fast expense entry with quantity × rate calculations or direct amounts
- Firestore-backed custom categories, stages, vendors, units, payment methods, and statuses
- Budget vs actual, live dashboard, category/stage reports, and real calculated insights
- Centralized INR/USD formatting without currency conversion
- Firestore security rules and required index definitions

## Run locally

1. Install dependencies with `yarn install`.
2. In the Firebase console for `gharkhata-b6513`, enable **Email/Password** in Authentication and create a Cloud Firestore database.
3. Deploy the included security resources from a Firebase CLI project:

   ```sh
   firebase deploy --project gharkhata-b6513 --only firestore:rules,firestore:indexes
   ```

4. Start the app:

   ```sh
   yarn start
   ```

The Firebase web configuration is in `src/lib/firebase.ts`; Firebase client keys identify the project but do not secure data. The deployed rules are what enforce ownership. For a different Firebase project, replace that config with `EXPO_PUBLIC_FIREBASE_*` build variables before production builds.

## Firebase data design

Each project stores a member UID list and a UID-to-role map. Business documents are top-level collections but are scoped by `projectId`: `expenses`, `categories`, `stages`, `vendors`, `units`, `paymentMethods`, `paymentStatuses`, and `budgets`. `projectInvites` holds the email-based invitations until the recipient accepts them in the app.

- **Admin:** manages project settings, budget, team, invitations, and operational records.
- **Editor:** creates and changes expenses and shared master data.
- **Viewer:** can read the project only.

The app queries expenses and master data by selected project. Master-data deletion is blocked in the client if any project expense references the record; no financial record is cascade-deleted.

## Validation and verification

Run static type validation:

```sh
npx tsc --noEmit
```

Manual end-to-end checklist:

1. Sign up, create a project, and verify default master data appears in expense entry.
2. Add an expense with quantity/rate and one using a direct amount; confirm dashboard and reports update.
3. Edit and delete the expense.
4. Create a category, reference it in an expense, and verify deletion is prevented.
5. Change INR/USD in More and verify amounts reformat without conversion.
6. Invite a separate Firebase user from More → Project members, accept it from More → Invitations, then verify editor and viewer behavior.
