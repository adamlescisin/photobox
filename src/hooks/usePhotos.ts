import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Photo = Tables<"photos">;

export const usePhotos = (eventId?: string) => {
  return useQuery({
    queryKey: ["photos", eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("event_id", eventId!)
        .order("timestamp", { ascending: false });
      if (error) throw error;
      return data as Photo[];
    },
  });
};

export const usePhoto = (photoId?: string) => {
  return useQuery({
    queryKey: ["photos", "detail", photoId],
    enabled: !!photoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("id", photoId!)
        .single();
      if (error) throw error;
      return data as Photo;
    },
  });
};

export const useDeletePhoto = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
};

export const useTogglePhotoHidden = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const { error } = await supabase
        .from("photos")
        .update({ hidden })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["photos"] }),
  });
};
