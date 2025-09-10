"use client";
import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function PollVoteClient({
  poll,
  options,
}: {
  poll: any;
  options: any[];
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localOptions, setLocalOptions] = useState(options);

  const getPercentage = (votes: number) => {
    const totalVotes = localOptions.reduce(
      (sum: number, option: any) => sum + option.votes,
      0
    );
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const handleVote = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please sign in to vote.");
        setIsSubmitting(false);
        return;
      }
      if (!selectedOption || !poll) {
        setError("Please select an option.");
        setIsSubmitting(false);
        return;
      }
      const { error: rpcError } = await supabase.rpc("vote_on_option", {
        poll_id: poll.id,
        option_id: selectedOption,
      });
      if (rpcError) {
        setError(
          rpcError.message || rpcError.details || "Failed to submit vote."
        );
        setIsSubmitting(false);
        return;
      }
      setHasVoted(true);
    } catch (err: any) {
      setError("Unexpected error: " + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {!hasVoted ? (
        <div className="space-y-3">
          {localOptions.map((option: any) => (
            <div
              key={option.id}
              tabIndex={0}
              role="button"
              aria-pressed={selectedOption === option.id}
              aria-label={`Select option: ${option.text}`}
              className={`p-3 border rounded-md cursor-pointer transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${
                selectedOption === option.id
                  ? "border-blue-500 bg-blue-50"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => setSelectedOption(option.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedOption(option.id);
                }
              }}
            >
              {option.text}
            </div>
          ))}
          <Button
            onClick={handleVote}
            disabled={!selectedOption || isSubmitting}
            className="mt-4"
          >
            {isSubmitting ? "Submitting..." : "Submit Vote"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-medium">Results:</h3>
          {localOptions.map((option: any) => (
            <div key={option.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{option.text}</span>
                <span>
                  {getPercentage(option.votes)}% ({option.votes} votes)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${getPercentage(option.votes)}%` }}
                ></div>
              </div>
            </div>
          ))}
          <div className="text-sm text-slate-500 pt-2">
            Total votes:{" "}
            {localOptions.reduce(
              (sum: number, option: any) => sum + option.votes,
              0
            )}
          </div>
        </div>
      )}
    </>
  );
}
