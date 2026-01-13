export const privacyPolicy = `
# Privacy Policy

**Last updated:** January 2026

## Introduction

Welcome to **Parcener**. I am Colin Gorski, and Parcener is an open-source project I developed to help groups split expenses collaboratively.

When this policy mentions "Parcener," "we," "us," or "our," it refers to the Parcener web application and its underlying infrastructure. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.

By using Parcener, you agree to the collection and use of information in accordance with this policy.

## Information We Collect

### Information You Provide

**Account Information:**

- Google account email and profile information (collected via Google OAuth)
- Display name (optional)

**Receipt Data:**

- Receipt images you upload
- Extracted receipt data (items, prices, totals)
- Receipt titles and notes you add

* **Important:** Please do not upload receipts containing sensitive personal information such as full credit card numbers, government IDs, or protected health information (PHI). You are responsible for redacting sensitive details before upload.

**Room and Collaboration Data:**

- Room names and configurations
- Items claimed by you or other participants
- **Payment Identifiers:** Venmo usernames or similar identifiers used solely for linking to external payment apps.

**Guest Access:**

- If you access a room without signing in, we assign a temporary Guest Identifier to track your selections within that specific session.

### Information Collected Automatically

**Usage Data:**

- IP address and browser type
- Access times and pages viewed
- Device information

**Cookies and Tracking:**

- Session cookies for authentication
- Security tokens

## How We Use Your Information

### Core Functionality

- **AI Processing:** To parse receipt images into editable items and prices.
- **Collaboration:** To sync real-time updates as participants claim items.
- **Math & Settlement:** To calculate fair splits.
- **Payment Linking:** To display your Venmo username to friends so they can pay you. **We do not process payments, nor do we store credit card numbers or bank account credentials.**

### Service Improvement

- As an open-source project, we use error tracking to analyze bugs and performance issues to improve the application stability.

### Legal Compliance

- Enforce our Terms of Service
- Respond to legal requests
- Protect our rights and safety

## AI Processing & Data Privacy

We use **Google Gemini** to process receipt images.

1. When you upload a receipt, the image is transmitted securely to Google's AI service.
2. We utilize standard API configurations. While we do not share your data for third-party advertising, you acknowledge that data is processed by Google's infrastructure.
3. Original images are stored in our secure storage (Cloudflare R2).

**Note:** AI-generated extractions may contain errors. Always review and verify receipt data before finalizing splits.

## Third-Party Services

We utilize the following third-party providers to operate the service. We do not sell your personal information to these parties, but data is transferred to them to provide core functionality.

### Authentication

- **Google OAuth**: Handles authentication securely.

### Infrastructure & Database

- **PlanetScale**: The primary database provider where user account and room data is stored.
- **Cloudflare Workers**: Application hosting and serverless compute.
- **Cloudflare R2**: Encrypted object storage for receipt images.
- **Cloudflare Hyperdrive & Queues**: Database connection acceleration and asynchronous processing.

### Monitoring & Reliability

- **Sentry**: Used for error tracking and performance monitoring (traces) to help us identify and fix bugs in real-time.

### AI

- **Google Gemini**: Receipt image processing.

## Data Retention and Deletion

We believe in keeping data only as long as necessary.

**Inactive Room Policy:**

- To maintain system performance and minimize data storage, Rooms that have been **inactive for 1 year** (no new uploads or edits) will be automatically deleted along with all associated receipt images and transaction data.

**Account Deletion:**
You may request the deletion of your account at any time. Upon deletion:

1. **Personal Identifiers:** Your name, email, and Google profile data are permanently removed from our database.
2. **Transaction History:** To ensure calculations remain accurate for other users in your shared rooms, your claimed items and splits may be retained but will be **anonymized** (unlinked from your personal identity).
3. **Receipt Images:** Images you uploaded to active rooms will be deleted.

**Test Data:**

- End-to-End (E2E) test data is cleared automatically in CI environments.

## Data Security

We implement industry-standard security measures:

- Encryption in transit (HTTPS)
- Secure authentication via Google OAuth
- Database access controls
- Cloudflare security features

**Note:** No method of transmission over the internet is 100% secure. While we strive to protect your personal information, we cannot guarantee absolute security.

## Your Rights

### Access & Correction

You may view and update your account information directly through the application settings.

### Erasure (Right to be Forgotten)

To request full account deletion:

1. Email **privacy@parcener.app** with the subject line "Account Deletion Request."
2. We will process your request within 30 days.

### Data Portability

You may request an export of your data in a machine-readable format by contacting support.

## Cookies

We use essential cookies for:

- Session management
- Authentication
- Security

We do not use advertising cookies or tracking pixels.

## Children's Privacy

Parcener is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.

## International Users

Parcener is operated from the United States. If you access Parcener from outside the US, you consent to the transfer and processing of your information in the United States.

## Changes to This Policy

We may update this Privacy Policy periodically. We will post the updated policy with a new "Last Updated" date. Your continued use of the Service after changes are posted constitutes your acceptance of the new Policy.

## Contact Us

For privacy-related inquiries:

**Email:** privacy@parcener.app`;
