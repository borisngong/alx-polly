"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Simple in-memory rate limiter (for demonstration; use Redis for production)
const pollRateLimitMap = new Map<string, number[]>();
const POLL_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const POLL_RATE_LIMIT_MAX = 3; // Max 3 polls per window

/**
 * Creates a new poll for the authenticated user.
 * Validates question and options, ensures user is logged in.
 * Returns error messages for validation or database failures.
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Extract poll question and options from form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate poll input
  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Rate limiting: allow max N polls per user per window
  const now = Date.now();
  const userKey = user.id;
  let timestamps = pollRateLimitMap.get(userKey) || [];
  // Remove timestamps outside window
  timestamps = (Array.isArray(timestamps) ? timestamps : []).filter(
    (ts: number) => now - ts < POLL_RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= POLL_RATE_LIMIT_MAX) {
    return {
      error: `Rate limit exceeded. You can create up to ${POLL_RATE_LIMIT_MAX} polls per minute.`,
    };
  }
  timestamps.push(now);
  pollRateLimitMap.set(userKey, timestamps);

  // Insert poll into database
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question,
      options,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  // Revalidate poll list for all users
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Fetches all polls created by the authenticated user.
 *
 * @returns {Promise<{ polls: any[]; error: string | null }>}
 *   - polls: Array of poll objects belonging to the user
 *   - error: Error message if not authenticated or if a database error occurs
 *
 * Why: This function ensures users only see their own polls, supporting privacy and personalized dashboards.
 * Edge cases: Handles unauthenticated users and database errors gracefully.
 */
import type { Poll } from "../types";

export async function getUserPolls(): Promise<{
  polls: Poll[];
  error: string | null;
}> {
  const supabase = await createClient();
  // Get the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // User is not authenticated
    return { polls: [], error: "Not authenticated" };
  }

  // Query polls owned by the user, ordered by creation date (newest first)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    // Database error occurred
    return { polls: [], error: error.message };
  }
  // Return polls as Poll[] or empty array if none found
  return { polls: (data as Poll[]) ?? [], error: null };
}

/**
 * Fetches a poll by its ID, only if the authenticated user is the owner.
 * Returns the poll data or an error if not authorized.
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { poll: null, error: userError.message };
  }
  if (!user) {
    return { poll: null, error: "Not authenticated" };
  }

  // Only allow viewing poll if user is owner (or implement public/private logic)
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return { poll: null, error: error.message };
  return { poll: data, error: null };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Optionally require login to vote
  // if (!user) return { error: 'You must be logged in to vote.' };

  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "Not authenticated" };
  }

  // Only allow deleting poll if user is owner
  const { error } = await supabase
    .from("polls")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  if (!question || options.length < 2) {
    return { error: "Please provide a question and at least two options." };
  }

  // Get user from session
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ question, options })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
