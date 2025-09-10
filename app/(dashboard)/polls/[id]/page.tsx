import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import PollVoteClient from "./PollVoteClient";

export default async function PollPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("id", params.id)
    .single();
  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-red-500">
        Poll not found.
      </div>
    );
  }
  // Normalize poll data for PollVoteClient
  const poll = {
    id: data.id,
    question: data.question || data.title,
    description: data.description,
    createdBy: data.created_by || data.createdBy,
    createdAt: data.created_at || data.createdAt,
  };
  const options = Array.isArray(data.poll_options)
    ? data.poll_options.map(
        (opt: any) => opt.option_text || opt.text || opt.value
      )
    : [];
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        <Link
          href={`/polls/${params.id}/edit`}
          className="text-blue-600 hover:underline"
        >
          Edit Poll
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
          <CardDescription>{poll.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <PollVoteClient poll={poll} options={options} />
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created by {poll.createdBy}</span>
          <span>
            Created on{" "}
            {poll.createdAt
              ? new Date(poll.createdAt).toLocaleDateString()
              : ""}
          </span>
        </CardFooter>
      </Card>
      {/* Share controls can be added here if needed */}
    </div>
  );
}
