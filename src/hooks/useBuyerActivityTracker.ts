import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrackingParams {
  entityType: "pet" | "product" | "vet";
  entityId: string | undefined;
  entityName?: string;
  entityImage?: string;
}

const useBuyerActivityTracker = ({ entityType, entityId, entityName, entityImage }: TrackingParams) => {
  const startTime = useRef(Date.now());
  const activityIdRef = useRef<string | null>(null);
  const insertedRef = useRef(false);

  // Insert activity row on mount (once per entityId)
  useEffect(() => {
    if (!entityId) return;
    insertedRef.current = false;
    activityIdRef.current = null;

    const logView = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from("buyer_activity")
          .insert({
            user_id: session.user.id,
            activity_type: "page_view",
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName || null,
            entity_image: entityImage || null,
            duration_seconds: 0,
          })
          .select("id")
          .single();

        if (!error && data) {
          activityIdRef.current = data.id;
          insertedRef.current = true;
        } else {
          console.warn("Activity tracking insert failed:", error?.message);
        }
      } catch (e) {
        // Silent fail — tracking should never break the app
      }
    };

    startTime.current = Date.now();
    logView();

    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const aid = activityIdRef.current;
      if (aid && duration > 0) {
        supabase
          .from("buyer_activity")
          .update({ duration_seconds: duration })
          .eq("id", aid)
          .then(() => {});
      }
    };
  }, [entityId, entityType]);

  // Update entity name/image once data loads (async after page fetch)
  useEffect(() => {
    if (!activityIdRef.current) return;
    if (!entityName && !entityImage) return;
    const updates: Record<string, string> = {};
    if (entityName) updates.entity_name = entityName;
    if (entityImage) updates.entity_image = entityImage;
    supabase
      .from("buyer_activity")
      .update(updates)
      .eq("id", activityIdRef.current)
      .then(() => {});
  }, [entityName, entityImage]);
};

export default useBuyerActivityTracker;
