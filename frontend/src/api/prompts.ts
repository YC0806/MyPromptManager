import { get, patch, post, remove } from "./client";
import type { Prompt, PromptVersion } from "../types/models";

export interface PromptQuery {
  search?: string;
  tags__name?: string[];
  is_archived?: boolean;
}

export const fetchPrompts = (params: PromptQuery = {}) => {
  const formatted = {
    ...params,
    tags__name: Array.isArray(params.tags__name)
      ? params.tags__name
      : undefined,
    is_archived:
      typeof params.is_archived === "boolean" ? String(params.is_archived) : undefined
  };
  return get<Prompt[]>("/prompts/", formatted);
};

export const fetchPrompt = (id: string) => get<Prompt>(`/prompts/${id}/`);

export interface CreatePromptInput {
  name: string;
  description?: string;
  tags?: string[];
  content: string;
  metadata?: Record<string, unknown>;
  changelog?: string;
  is_archived?: boolean;
}

export const createPrompt = (payload: CreatePromptInput) =>
  post<Prompt>("/prompts/", payload);

export type UpdatePromptInput = Partial<CreatePromptInput>;

export const updatePrompt = (id: string, payload: UpdatePromptInput) =>
  patch<Prompt, UpdatePromptInput>(`/prompts/${id}/`, payload);

export const deletePrompt = (id: string) => remove(`/prompts/${id}/`);

export interface CreatePromptVersionInput {
  prompt: string;
  content: string;
  metadata?: Record<string, unknown>;
  changelog?: string;
}

export const createPromptVersion = (payload: CreatePromptVersionInput) =>
  post<PromptVersion>("/prompt-versions/", payload);

export const fetchPromptVersions = (promptId: string) =>
  get<PromptVersion[]>("/prompt-versions/", { prompt: promptId });

export const restorePromptVersion = (
  promptId: string,
  version: number,
  changelog?: string
) =>
  post<PromptVersion>(`/prompt-versions/${promptId}:v${version}/restore/`, {
    changelog
  });
