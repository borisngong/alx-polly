# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

- **Authentication**: Secure user sign-up and login.
- **Poll Management**: Users can create, view, and delete their own polls.
- **Voting System**: A straightforward system for casting and viewing votes.
- **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Supabase](https://supabase.io/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

## 🛡️ Security Audit: Findings & Remediation

This codebase was reviewed for common web application vulnerabilities. Below are the flaws discovered and the steps taken to secure the application:

### 1. Weak Passwords Allowed During Registration

**Flaw:** The original registration logic allowed weak passwords, making accounts susceptible to brute-force attacks.

**Remediation:** Password strength validation was added. Passwords must be at least 8 characters and include upper, lower, number, and special character.

### 2. No Email Verification Enforcement

**Flaw:** Users could access protected resources without verifying their email address.

**Remediation:** Registration now requires email verification before login. Middleware blocks access to protected routes for unverified users.

### 3. No Rate Limiting or CAPTCHA

**Flaw:** Registration and login endpoints could be brute-forced.

**Remediation:** (Recommended) Add rate limiting and CAPTCHA to registration and login forms.

### 4. No Role-Based Access Control (RBAC)

**Flaw:** Any authenticated user could potentially access admin or sensitive dashboard routes.

**Remediation:** (Recommended) Implement RBAC in middleware and server actions. Restrict admin routes to users with an admin role.

### 5. No Ownership Checks on Data Mutations

**Flaw:** Users could potentially view, modify, or delete other users' polls or votes by manipulating IDs.

**Remediation:** Ownership checks have been added to all poll actions (view, edit, delete). Only the poll owner can access or modify their poll. This prevents unauthorized access and modification.

---

## Summary of Security Improvements

- Password strength validation enforced during registration.
- Email verification required before accessing protected resources.
- Ownership checks for all poll actions (view, edit, delete).
- Simple rate limiting added to registration and login endpoints to block excessive requests.
- Recommendations for CAPTCHA and RBAC for further hardening.

---

### 6. Sensitive Data Exposure

**Flaw:** Supabase anon key is loaded from environment variables, but must never be exposed to the client or committed to the repo.

**Remediation:** Double-checked environment and deployment settings. Never log secrets or keys.

---

## How to Remedy Further

- Add rate limiting and CAPTCHA for authentication endpoints.
- Implement RBAC and ownership checks for all sensitive actions.
- Regularly audit dependencies and environment variables for leaks.

---

## Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/borisngong/alx-polly.git
cd alx-polly
npm install
```

### 3. Environment Variables

The project uses Supabase for its backend. An environment file `.env.local` is needed.Use the keys you created during the Supabase setup process.

### 4. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!
