import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Event = Tables<"events">;
export type EventPublic = Tables<"events_public">;
export type EventStyle = Tables<"event_styles">;

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useEvent = (id?: string) => {
  return useQuery({
    queryKey: ["events", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Event;
    },
  });
};

/** Public-safe hook: queries the events_public view which excludes password_hash */
export const useEventBySlug = (slug?: string) => {
  return useQuery({
    queryKey: ["events_public", "slug", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events_public")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data as EventPublic;
    },
  });
};

export const useEventStyle = (eventId?: string) => {
  return useQuery({
    queryKey: ["event_styles", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_styles")
        .select("*")
        .eq("event_id", eventId!)
        .maybeSingle();
      if (error) throw error;
      return data as EventStyle | null;
    },
  });
};

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: TablesInsert<"events">) => {
      const { data, error } = await supabase
        .from("events")
        .insert(event)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["events"] }),
  });
};

export const useUpsertEventStyle = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (style: any) => {
      const { data, error } = await supabase
        .from("event_styles")
        .upsert(style, { onConflict: "event_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event_styles"] }),
  });
};
