import { get, patch, post, remove } from "./client";
import type { PromptTemplate, PromptTemplateVersion } from "../types/models";

export interface TemplateQuery {
  search?: string;
  tags__name?: string[];
  is_archived?: boolean;
}

export const fetchTemplates = (params: TemplateQuery = {}) => {
  const formatted = {
    ...params,
    tags__name: Array.isArray(params.tags__name)
      ? params.tags__name
      : undefined,
    is_archived:
      typeof params.is_archived === "boolean" ? String(params.is_archived) : undefined
  };
  return get<PromptTemplate[]>("/prompt-templates/", formatted);
};

export const fetchTemplate = (id: string) =>
  get<PromptTemplate>(`/prompt-templates/${id}/`);

export interface CreateTemplateInput {
  name: string;
  description?: string;
  tags?: string[];
  body: string;
  metadata?: Record<string, unknown>;
  placeholders?: string[];
  render_example?: string;
  changelog?: string;
  is_archived?: boolean;
}

export const createTemplate = (payload: CreateTemplateInput) =>
  post<PromptTemplate>("/prompt-templates/", payload);

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export const updateTemplate = (id: string, payload: UpdateTemplateInput) =>
  patch<PromptTemplate, UpdateTemplateInput>(
    `/prompt-templates/${id}/`,
    payload
  );

export const deleteTemplate = (id: string) =>
  remove(`/prompt-templates/${id}/`);

export interface CreateTemplateVersionInput {
  template: string;
  body: string;
  metadata?: Record<string, unknown>;
  placeholders?: string[];
  render_example?: string;
  changelog?: string;
}

export const createTemplateVersion = (payload: CreateTemplateVersionInput) =>
  post<PromptTemplateVersion>("/prompt-template-versions/", payload);

export const fetchTemplateVersions = (templateId: string) =>
  get<PromptTemplateVersion[]>("/prompt-template-versions/", {
    template: templateId
  });

export const restoreTemplateVersion = (
  templateId: string,
  version: number,
  changelog?: string
) =>
  post<PromptTemplateVersion>(
    `/prompt-template-versions/${templateId}:v${version}/restore/`,
    { changelog }
  );
