import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createPrompt,
  createPromptVersion,
  deletePrompt,
  fetchPrompt,
  fetchPrompts,
  fetchPromptVersions,
  restorePromptVersion,
  updatePrompt
} from "../../api/prompts";
import type {
  CreatePromptInput,
  UpdatePromptInput,
  CreatePromptVersionInput
} from "../../api/prompts";

const PROMPTS_KEY = ["prompts"];

export const usePrompts = (query?: Parameters<typeof fetchPrompts>[0]) =>
  useQuery({
    queryKey: query ? [...PROMPTS_KEY, query] : PROMPTS_KEY,
    queryFn: () => fetchPrompts(query)
  });

export const usePrompt = (promptId: string | undefined) =>
  useQuery({
    queryKey: ["prompts", promptId],
    queryFn: () => fetchPrompt(promptId ?? ""),
    enabled: Boolean(promptId)
  });

export const usePromptVersions = (promptId: string | undefined) =>
  useQuery({
    queryKey: ["prompts", promptId, "versions"],
    queryFn: () => fetchPromptVersions(promptId ?? ""),
    enabled: Boolean(promptId)
  });

export const useCreatePrompt = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromptInput) => createPrompt(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: PROMPTS_KEY });
    }
  });
};

export const useUpdatePrompt = (promptId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePromptInput) => updatePrompt(promptId, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["prompts", promptId] });
      client.invalidateQueries({ queryKey: PROMPTS_KEY });
    }
  });
};

export const useDeletePrompt = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (promptId: string) => deletePrompt(promptId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: PROMPTS_KEY });
    }
  });
};

export const useCreatePromptVersion = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePromptVersionInput) => createPromptVersion(payload),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: ["prompts", variables.prompt, "versions"]
      });
      client.invalidateQueries({
        queryKey: ["prompts", variables.prompt]
      });
    }
  });
};

export const useRestorePromptVersion = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      promptId,
      version,
      changelog
    }: {
      promptId: string;
      version: number;
      changelog?: string;
    }) => restorePromptVersion(promptId, version, changelog),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: ["prompts", variables.promptId, "versions"]
      });
      client.invalidateQueries({
        queryKey: ["prompts", variables.promptId]
      });
    }
  });
};
