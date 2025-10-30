import { useMemo } from "react";

import { useTags } from "../features/tags/hooks";

interface TagSelectorProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export const TagSelector = ({ value, onChange }: TagSelectorProps) => {
  const { data: tags = [] } = useTags();
  const lookup = useMemo(() => new Set(value), [value]);

  const toggleTag = (tag: string) => {
    const next = new Set(lookup);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    onChange(Array.from(next));
  };

  return (
    <div className="tag-selector">
      {tags.map((tag) => (
        <button
          type="button"
          key={tag.slug}
          className={`tag-pill ${lookup.has(tag.name) ? "selected" : ""}`}
          onClick={() => toggleTag(tag.name)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
};
