import { get, post, remove } from "./client";
import type { Tag } from "../types/models";

export const fetchTags = () => get<Tag[]>("/tags/");

export const createTag = (name: string) =>
  post<Tag>("/tags/", {
    name
  });

export const deleteTag = (slug: string) => remove(`/tags/${slug}/`);
