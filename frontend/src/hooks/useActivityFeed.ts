"use client";

import { useCallback, useState } from "react";
import { ActivityEvent } from "@/lib/types";

const MAX_EVENTS = 30;

/**
 * Client-side activity feed. Each successful contract call pushes an
 * event here immediately (optimistic). In production this would also
 * subscribe to `getEvents` on the Soroban RPC server, filtered by
 * contract ID and topic, to catch events from other users' transactions
 * in real time rather than waiting for the next poll of list_reports().
 */
export function useActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);

  const pushEvent = useCallback((event: Omit<ActivityEvent, "id">) => {
    setEvents((prev) => {
      const withId: ActivityEvent = { ...event, id: `${event.timestamp}-${Math.random()}` };
      return [withId, ...prev].slice(0, MAX_EVENTS);
    });
  }, []);

  return { events, pushEvent };
}
