import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useUpsertEventStyle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      style,
    }: {
      eventId: string;
      style: Omit<TablesInsert<"event_styles">, "event_id">;
    }) => {
      // Check if style exists
      const { data: existing } = await supabase
        .from("event_styles")
        .select("id")
        .eq("event_id", eventId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("event_styles")
          .update(style as TablesUpdate<"event_styles">)
          .eq("event_id", eventId)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("event_styles")
          .insert({ ...style, event_id: eventId })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["event_styles", vars.eventId] }),
  });
};

export const useUploadStyleAsset = () => {
  return useMutation({
    mutationFn: async ({
      eventId,
      file,
      type,
    }: {
      eventId: string;
      file: File;
      type: "logo" | "watermark" | "background";
    }) => {
      const ext = file.name.split(".").pop();
      const path = `${eventId}/${type}.${ext}`;

      const { error } = await supabase.storage
        .from("event-photos")
        .upload(path, file, { upsert: true });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("event-photos").getPublicUrl(path);

      return publicUrl;
    },
  });
};
