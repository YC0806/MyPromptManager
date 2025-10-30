import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createTemplate,
  createTemplateVersion,
  deleteTemplate,
  fetchTemplate,
  fetchTemplateVersions,
  fetchTemplates,
  restoreTemplateVersion,
  updateTemplate
} from "../../api/templates";
import type {
  CreateTemplateInput,
  CreateTemplateVersionInput,
  UpdateTemplateInput
} from "../../api/templates";

const TEMPLATES_KEY = ["templates"];

export const useTemplates = (query?: Parameters<typeof fetchTemplates>[0]) =>
  useQuery({
    queryKey: query ? [...TEMPLATES_KEY, query] : TEMPLATES_KEY,
    queryFn: () => fetchTemplates(query)
  });

export const useTemplate = (templateId: string | undefined) =>
  useQuery({
    queryKey: ["templates", templateId],
    queryFn: () => fetchTemplate(templateId ?? ""),
    enabled: Boolean(templateId)
  });

export const useTemplateVersions = (templateId: string | undefined) =>
  useQuery({
    queryKey: ["templates", templateId, "versions"],
    queryFn: () => fetchTemplateVersions(templateId ?? ""),
    enabled: Boolean(templateId)
  });

export const useCreateTemplate = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplateInput) => createTemplate(payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: TEMPLATES_KEY });
    }
  });
};

export const useUpdateTemplate = (templateId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTemplateInput) =>
      updateTemplate(templateId, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["templates", templateId] });
      client.invalidateQueries({ queryKey: TEMPLATES_KEY });
    }
  });
};

export const useDeleteTemplate = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: TEMPLATES_KEY });
    }
  });
};

export const useCreateTemplateVersion = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTemplateVersionInput) =>
      createTemplateVersion(payload),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: ["templates", variables.template, "versions"]
      });
      client.invalidateQueries({
        queryKey: ["templates", variables.template]
      });
    }
  });
};

export const useRestoreTemplateVersion = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      templateId,
      version,
      changelog
    }: {
      templateId: string;
      version: number;
      changelog?: string;
    }) => restoreTemplateVersion(templateId, version, changelog),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({
        queryKey: ["templates", variables.templateId, "versions"]
      });
      client.invalidateQueries({
        queryKey: ["templates", variables.templateId]
      });
    }
  });
};
