# API Endpoints - Prompt & Template Distinction

This document describes the updated API endpoints that distinguish between prompts and templates.

## Summary

All API endpoints now support separate routes for `prompts` and `templates`, allowing clear distinction between the two resource types.

## Detail API (`/v1/detail`)

### Prompts
- `GET /v1/detail/prompts/{prompt_id}/history` - Get commit history
- `GET /v1/detail/prompts/{prompt_id}/diff` - Get diff between references
- `GET /v1/detail/prompts/{prompt_id}/raw` - Read raw markdown
- `PUT /v1/detail/prompts/{prompt_id}/raw` - Write raw markdown
- `GET /v1/detail/prompts/{prompt_id}/releases` - List releases
- `POST /v1/detail/prompts/{prompt_id}/releases` - Create release

### Templates
- `GET /v1/detail/templates/{template_id}/history` - Get commit history
- `GET /v1/detail/templates/{template_id}/diff` - Get diff between references
- `GET /v1/detail/templates/{template_id}/raw` - Read raw markdown
- `PUT /v1/detail/templates/{template_id}/raw` - Write raw markdown
- `GET /v1/detail/templates/{template_id}/releases` - List releases
- `POST /v1/detail/templates/{template_id}/releases` - Create release

### Git Operations (Shared)
- `GET /v1/detail/git/branches` - List branches
- `POST /v1/detail/git/checkout` - Checkout branch
- `POST /v1/detail/git/tag` - Create tag

## Simple API (`/v1/simple`)

### Prompts
- `GET /v1/simple/prompts/{prompt_id}/timeline` - Get timeline
- `GET /v1/simple/prompts/{prompt_id}/content` - Get content
- `POST /v1/simple/prompts/{prompt_id}/save` - Save draft
- `POST /v1/simple/prompts/{prompt_id}/publish` - Publish version
- `GET /v1/simple/prompts/{prompt_id}/compare` - Compare versions
- `POST /v1/simple/prompts/{prompt_id}/rollback` - Rollback version

### Templates
- `GET /v1/simple/templates/{template_id}/timeline` - Get timeline
- `GET /v1/simple/templates/{template_id}/content` - Get content
- `POST /v1/simple/templates/{template_id}/save` - Save draft
- `POST /v1/simple/templates/{template_id}/publish` - Publish version
- `GET /v1/simple/templates/{template_id}/compare` - Compare versions
- `POST /v1/simple/templates/{template_id}/rollback` - Rollback version

## Common API (`/v1`)

### Search
- `GET /v1/search` - Search all items
  - Query params:
    - `type` - Filter by type: `prompt` or `template`
    - `labels` - Filter by labels
    - `slug` - Filter by slug
    - `author` - Filter by author
    - `limit` - Max results (default: 50)
    - `cursor` - Pagination cursor

### Index Management
- `GET /v1/index/status` - Get index status
- `POST /v1/index/repair` - Repair index
- `POST /v1/index/rebuild` - Rebuild index

### Schemas
- `GET /v1/schemas/frontmatter` - Get frontmatter schema
- `GET /v1/schemas/index` - Get index schema

### Validation
- `POST /v1/validate/frontmatter` - Validate frontmatter

### Health
- `GET /v1/health` - Health check

## Response Format Changes

All endpoints now return the appropriate ID field in responses:

### For Prompts
```json
{
  "prompt_id": "01HQXYZ...",
  // ... other fields
}
```

### For Templates
```json
{
  "template_id": "01HQXYZ...",
  // ... other fields
}
```

## Examples

### Get prompt history
```bash
GET /v1/detail/prompts/01HQXYZ123/history
```

Response:
```json
{
  "prompt_id": "01HQXYZ123",
  "file_path": "prompts/prompt_01HQXYZ123.md",
  "history": [...],
  "count": 10
}
```

### Get template history
```bash
GET /v1/detail/templates/01HQABC456/history
```

Response:
```json
{
  "template_id": "01HQABC456",
  "file_path": "templates/template_01HQABC456.md",
  "history": [...],
  "count": 5
}
```

### Search for prompts only
```bash
GET /v1/search?type=prompt&labels=production
```

### Search for templates only
```bash
GET /v1/search?type=template&author=admin
```

## Implementation Details

### View Updates
All views now accept optional keyword arguments:
- `prompt_id=None`
- `template_id=None`

The view logic determines the item type and ID:
```python
def get(self, request, prompt_id=None, template_id=None):
    item_id = prompt_id or template_id
    item_type = 'prompt' if prompt_id else 'template'
    # ... rest of logic
```

### URL Pattern Updates
URLs are defined for both prompts and templates:
```python
path('prompts/<str:prompt_id>/history', views.HistoryView.as_view(), name='detail-prompt-history'),
path('templates/<str:template_id>/history', views.HistoryView.as_view(), name='detail-template-history'),
```

### Backward Compatibility
The search API maintains backward compatibility by allowing the `type` parameter to be optional. When omitted, it searches both prompts and templates.

## Testing

Run the test suite:
```bash
python test_api_endpoints.py
```

This validates:
- URL pattern resolution
- View parameter handling
- Response format consistency
- Search filtering by type
