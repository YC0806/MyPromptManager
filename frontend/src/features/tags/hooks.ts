import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createTag, deleteTag, fetchTags } from "../../api/tags";

const TAGS_KEY = ["tags"];

export const useTags = () =>
  useQuery({
    queryKey: TAGS_KEY,
    queryFn: () => fetchTags()
  });

export const useCreateTag = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: TAGS_KEY });
    }
  });
};

export const useDeleteTag = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => deleteTag(slug),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: TAGS_KEY });
    }
  });
};
