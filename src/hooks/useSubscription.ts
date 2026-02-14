"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export type SubscriptionState = {
  loading: boolean;
  status: string | null;
  customerId: string | null;
  refresh: () => Promise<void>;
};

export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const {
      data: { session }
    } = await supabaseBrowser.auth.getSession();

    if (!session?.user) {
      setStatus(null);
      setCustomerId(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("profiles")
      .select("subscription_status, stripe_customer_id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      setStatus(null);
      setCustomerId(null);
      setLoading(false);
      return;
    }

    setStatus(data?.subscription_status ?? null);
    setCustomerId(data?.stripe_customer_id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    status,
    customerId,
    refresh: load
  };
}
