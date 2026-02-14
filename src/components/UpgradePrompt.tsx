"use client";

import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function UpgradePrompt() {
  const { status, loading } = useSubscription();
  const [pending, setPending] = useState(false);

  if (loading || status === "active") {
    return null;
  }

  const handleUpgrade = async () => {
    setPending(true);
    try {
      const {
        data: { session }
      } = await supabaseBrowser.auth.getSession();

      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          email: session?.user?.email
        })
      });

      if (!res.ok) {
        throw new Error("Unable to create checkout session");
      }

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-200">
      <div className="font-semibold text-zinc-100">Unlock Pro insights</div>
      <div className="mt-1 text-zinc-400">
        Connect Stripe to enable full analysis history and premium storage.
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={pending}
        className="mt-3 inline-flex items-center justify-center rounded-md bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-300"
      >
        {pending ? "Redirecting..." : "Upgrade to Pro"}
      </button>
    </div>
  );
}
