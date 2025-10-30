import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "./shell/AppLayout";
import { PromptsPage } from "./features/prompts/PromptsPage";
import { PromptDetailPage } from "./features/prompts/PromptDetailPage";
import { TemplatesPage } from "./features/templates/TemplatesPage";
import { TemplateDetailPage } from "./features/templates/TemplateDetailPage";
import { TagsPage } from "./features/tags/TagsPage";
import { ActivityPage } from "./features/activity/ActivityPage";
import { NotFound } from "./shell/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <PromptsPage /> },
      { path: "prompts", element: <PromptsPage /> },
      { path: "prompts/new", element: <PromptDetailPage /> },
      { path: "prompts/:promptId", element: <PromptDetailPage /> },
      { path: "templates", element: <TemplatesPage /> },
      { path: "templates/new", element: <TemplateDetailPage /> },
      { path: "templates/:templateId", element: <TemplateDetailPage /> },
      { path: "tags", element: <TagsPage /> },
      { path: "activity", element: <ActivityPage /> }
    ]
  }
]);
