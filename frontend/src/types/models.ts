export interface Tag {
  name: string;
  slug: string;
  created_at: string;
}

export interface PromptVersion {
  id: string;
  prompt: string;
  version: number;
  content: string;
  metadata: Record<string, unknown>;
  changelog: string | null;
  created_at: string;
  created_by: string | null;
}

export interface Prompt {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  active_version: PromptVersion | null;
  latest_version: PromptVersion | null;
}

export interface PromptTemplateVersion {
  id: string;
  template: string;
  version: number;
  body: string;
  metadata: Record<string, unknown>;
  placeholders: string[];
  render_example: string;
  changelog: string | null;
  created_at: string;
  created_by: string | null;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  active_version: PromptTemplateVersion | null;
  latest_version: PromptTemplateVersion | null;
}

export interface PaginatedResponse<T> {
  results: T[];
  count?: number;
}
