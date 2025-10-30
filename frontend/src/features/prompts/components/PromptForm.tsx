import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { TagSelector } from "../../../components/TagSelector";
import type { Prompt } from "../../../types/models";

const promptSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  metadata: z.string().optional(),
  changelog: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_archived: z.boolean().optional()
});

export type PromptFormValues = z.infer<typeof promptSchema>;

interface PromptFormProps {
  initial?: Prompt;
  onSubmit: (values: PromptFormValues) => void;
  isSubmitting?: boolean;
  onCreateVersion?: (values: PromptFormValues) => void;
  canCreateVersion?: boolean;
}

export const PromptForm = ({
  initial,
  onSubmit,
  isSubmitting,
  onCreateVersion,
  canCreateVersion
}: PromptFormProps) => {
  const {
    control,
    handleSubmit,
    register,
    getValues,
    reset,
    formState: { errors }
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      name: "",
      description: "",
      content: "",
      metadata: "{}",
      changelog: "",
      tags: [],
      is_archived: false
    }
  });

  useEffect(() => {
    if (!initial) {
      reset();
      return;
    }
    reset({
      name: initial.name,
      description: initial.description ?? "",
      content: initial.latest_version?.content ?? "",
      metadata: JSON.stringify(initial.latest_version?.metadata ?? {}, null, 2),
      changelog: "",
      tags: initial.tags,
      is_archived: initial.is_archived
    });
  }, [initial, reset]);

  const submitHandler = (values: PromptFormValues) => {
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="grid" style={{ gap: "1.5rem" }}>
      <div className="grid grid--two">
        <div className="card">
          <label>
            <span>Name</span>
            <input
              {...register("name")}
              placeholder="Welcome Email"
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </label>
          {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
          <label style={{ marginTop: "1rem" }}>
            <span>Description</span>
            <textarea
              {...register("description")}
              placeholder="Short summary of what this prompt does."
              style={{ width: "100%", minHeight: 120, marginTop: "0.5rem" }}
            />
          </label>
        </div>
        <div className="card">
          <div>
            <h3 style={{ marginTop: 0 }}>Tags</h3>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagSelector
                  value={field.value ?? []}
                  onChange={(tags) => field.onChange(tags)}
                />
              )}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" {...register("is_archived")} />
            Archived
          </label>
        </div>
      </div>
      <div className="card">
        <label>
          <span>Prompt Content</span>
          <textarea
            {...register("content")}
            placeholder="Hi {{user_name}}, welcome..."
            style={{ width: "100%", minHeight: 200, marginTop: "0.5rem" }}
          />
        </label>
        {errors.content && <p style={{ color: "red" }}>{errors.content.message}</p>}
      </div>
      <div className="grid grid--two">
        <div className="card metadata-editor">
          <label>
            <span>Metadata</span>
            <textarea
              {...register("metadata")}
              style={{ marginTop: "0.5rem" }}
              placeholder='{"language": "en-US"}'
            />
          </label>
        </div>
        <div className="card">
          <label>
            <span>Changelog (optional)</span>
            <textarea
              {...register("changelog")}
              placeholder="Summarize what changed..."
              style={{ width: "100%", minHeight: 160, marginTop: "0.5rem" }}
            />
          </label>
        </div>
      </div>
      <div>
        <button className="primary-button" type="submit" disabled={isSubmitting}>
          Save Changes
        </button>
        {onCreateVersion && (
          <button
            className="secondary-button"
            style={{ marginLeft: "0.75rem" }}
            type="button"
            onClick={() => onCreateVersion(getValues())}
            disabled={!canCreateVersion}
          >
            Save as New Version
          </button>
        )}
      </div>
    </form>
  );
};
