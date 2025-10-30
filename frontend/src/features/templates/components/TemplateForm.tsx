import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { TagSelector } from "../../../components/TagSelector";
import type { PromptTemplate } from "../../../types/models";

const templateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  metadata: z.string().optional(),
  placeholders: z.string().optional(),
  render_example: z.string().optional(),
  changelog: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_archived: z.boolean().optional()
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateFormProps {
  initial?: PromptTemplate;
  onSubmit: (values: TemplateFormValues) => void;
  onCreateVersion?: (values: TemplateFormValues) => void;
  canCreateVersion?: boolean;
  isSubmitting?: boolean;
}

export const TemplateForm = ({
  initial,
  onSubmit,
  onCreateVersion,
  canCreateVersion,
  isSubmitting
}: TemplateFormProps) => {
  const {
    control,
    handleSubmit,
    register,
    getValues,
    reset,
    formState: { errors }
  } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      body: "",
      metadata: "{}",
      placeholders: "",
      render_example: "",
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
      body: initial.latest_version?.body ?? "",
      metadata: JSON.stringify(initial.latest_version?.metadata ?? {}, null, 2),
      placeholders: (initial.latest_version?.placeholders ?? []).join("\n"),
      render_example: initial.latest_version?.render_example ?? "",
      changelog: "",
      tags: initial.tags,
      is_archived: initial.is_archived
    });
  }, [initial, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid" style={{ gap: "1.5rem" }}>
      <div className="grid grid--two">
        <div className="card">
          <label>
            <span>Name</span>
            <input
              {...register("name")}
              placeholder="Order Confirmation"
              style={{ width: "100%", marginTop: "0.5rem" }}
            />
          </label>
          {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
          <label style={{ marginTop: "1rem" }}>
            <span>Description</span>
            <textarea
              {...register("description")}
              placeholder="Short summary of the template target."
              style={{ width: "100%", minHeight: 120, marginTop: "0.5rem" }}
            />
          </label>
        </div>
        <div className="card">
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
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input type="checkbox" {...register("is_archived")} />
            Archived
          </label>
        </div>
      </div>
      <div className="card">
        <label>
          <span>Template Body</span>
          <textarea
            {...register("body")}
            placeholder="Hi {{customer_name}}, your order..."
            style={{ width: "100%", minHeight: 200, marginTop: "0.5rem" }}
          />
        </label>
        {errors.body && <p style={{ color: "red" }}>{errors.body.message}</p>}
      </div>
      <div className="grid grid--two">
        <div className="card metadata-editor">
          <label>
            <span>Metadata</span>
            <textarea
              {...register("metadata")}
              style={{ marginTop: "0.5rem" }}
              placeholder='{"channel": "email"}'
            />
          </label>
        </div>
        <div className="card">
          <label>
            <span>Placeholders (one per line)</span>
            <textarea
              {...register("placeholders")}
              style={{ width: "100%", minHeight: 160, marginTop: "0.5rem" }}
              placeholder="customer_name&#10;order_id"
            />
          </label>
          <label style={{ marginTop: "1rem" }}>
            <span>Render Example</span>
            <textarea
              {...register("render_example")}
              style={{ width: "100%", minHeight: 160, marginTop: "0.5rem" }}
              placeholder="Hi Alice, your order #12345..."
            />
          </label>
        </div>
      </div>
      <div className="card">
        <label>
          <span>Changelog (optional)</span>
          <textarea
            {...register("changelog")}
            placeholder="Summarize what changed..."
            style={{ width: "100%", minHeight: 120, marginTop: "0.5rem" }}
          />
        </label>
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
