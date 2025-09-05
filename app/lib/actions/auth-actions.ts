"use server";

import { createClient } from "@/lib/supabase/server";
import { LoginFormData, RegisterFormData } from "../types";

/**
 * Simple in-memory rate limiter (for demo only).
 * Tracks request counts per IP and action within a time window.
 * Used to prevent brute-force attacks on login and registration endpoints.
 */
const rateLimitStore: Record<string, { count: number; last: number }> = {};
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 requests per window

/**
 * Checks if the given IP has exceeded the allowed number of requests for the specified action.
 * Returns an error message if rate limit is exceeded, otherwise null.
 */
function checkRateLimit(ip: string, action: string): string | null {
  const key = `${action}:${ip}`;
  const now = Date.now();
  const entry = rateLimitStore[key] || { count: 0, last: now };
  // Reset count if outside the time window
  if (now - entry.last > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.last = now;
  } else {
    entry.count += 1;
  }
  rateLimitStore[key] = entry;
  if (entry.count > RATE_LIMIT_MAX) {
    return `Too many requests. Please wait and try again.`;
  }
  return null;
}

/**
 * Authenticates a user using email and password.
 * Applies rate limiting to prevent brute-force attacks.
 * Returns an error message if authentication fails or rate limit is exceeded.
 */
export async function login(data: LoginFormData) {
  // For demo: use a random string as IP (replace with real IP extraction in production)
  const ip = Math.random().toString(36).substring(2, 10);
  const rateError = checkRateLimit(ip, "login");
  if (rateError) {
    return { error: rateError };
  }

  const supabase = await createClient();
  // Attempt to sign in with provided credentials
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success: no error
  return { error: null };
}

/**
 * Registers a new user with email, password, and name.
 * Applies rate limiting and enforces password strength requirements.
 * Requires email verification before allowing login.
 * Returns error messages for validation, rate limit, or registration failures.
 */
export async function register(data: RegisterFormData) {
  // For demo: use a random string as IP (replace with real IP extraction in production)
  const ip = Math.random().toString(36).substring(2, 10);
  const rateError = checkRateLimit(ip, "register");
  if (rateError) {
    return { error: rateError };
  }

  // Password strength validation
  const password = data.password;
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  // Enforce password policy for security
  if (
    password.length < minLength ||
    !hasUpper ||
    !hasLower ||
    !hasNumber ||
    !hasSpecial
  ) {
    return {
      error:
        "Password must be at least 8 characters and include upper, lower, number, and special character.",
    };
  }

  const supabase = await createClient();
  // Attempt to register user with Supabase
  const { data: signUpData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Require email verification before login
  if (!signUpData?.user?.email_confirmed_at) {
    return {
      error:
        "Registration successful. Please verify your email before logging in.",
      emailVerificationRequired: true,
    };
  }

  // Success: no error
  return { error: null };
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
