# API Migration Guide - Prompt & Template Distinction

This guide helps you migrate from the old unified API to the new API that distinguishes between prompts and templates.

## Overview

The API has been updated to provide separate endpoints for prompts and templates. This change improves clarity and allows for better type-specific handling.

## What Changed

### Before (Old API)
All endpoints used a generic `{id}` parameter:
```
/v1/detail/prompts/{id}/history
/v1/simple/prompts/{id}/timeline
```

The API couldn't distinguish whether an ID referred to a prompt or a template.

### After (New API)
Endpoints now have separate routes for prompts and templates:
```
/v1/detail/prompts/{prompt_id}/history
/v1/detail/templates/{template_id}/history
/v1/simple/prompts/{prompt_id}/timeline
/v1/simple/templates/{template_id}/timeline
```

## Migration Steps

### 1. Update URL Patterns

#### Detail API

**Old:**
```
GET /v1/detail/prompts/01HQXYZ123/history
```

**New (Prompts):**
```
GET /v1/detail/prompts/01HQXYZ123/history
```

**New (Templates):**
```
GET /v1/detail/templates/01HQABC456/history
```

#### Simple API

**Old:**
```
GET /v1/simple/prompts/01HQXYZ123/timeline
```

**New (Prompts):**
```
GET /v1/simple/prompts/01HQXYZ123/timeline
```

**New (Templates):**
```
GET /v1/simple/templates/01HQABC456/timeline
```

### 2. Update Response Parsing

#### Response Field Changes

**For Prompts:**
```json
{
  "prompt_id": "01HQXYZ123",  // Changed from generic "id"
  // ... other fields
}
```

**For Templates:**
```json
{
  "template_id": "01HQABC456",  // Changed from generic "id"
  // ... other fields
}
```

### 3. Update Search Queries

The search API now supports explicit type filtering:

**Search all items (backward compatible):**
```bash
GET /v1/search?labels=production
```

**Search prompts only:**
```bash
GET /v1/search?type=prompt&labels=production
```

**Search templates only:**
```bash
GET /v1/search?type=template&labels=production
```

## Code Examples

### JavaScript/TypeScript

#### Before
```typescript
async function getHistory(id: string) {
  const response = await fetch(`/v1/detail/prompts/${id}/history`);
  const data = await response.json();
  return data;
}
```

#### After
```typescript
async function getPromptHistory(promptId: string) {
  const response = await fetch(`/v1/detail/prompts/${promptId}/history`);
  const data = await response.json();
  return data.prompt_id; // Now returns prompt_id
}

async function getTemplateHistory(templateId: string) {
  const response = await fetch(`/v1/detail/templates/${templateId}/history`);
  const data = await response.json();
  return data.template_id; // Now returns template_id
}

// Generic function that handles both types
async function getHistory(id: string, type: 'prompt' | 'template') {
  const endpoint = type === 'prompt'
    ? `/v1/detail/prompts/${id}/history`
    : `/v1/detail/templates/${id}/history`;

  const response = await fetch(endpoint);
  const data = await response.json();
  return type === 'prompt' ? data.prompt_id : data.template_id;
}
```

### Python

#### Before
```python
def get_history(item_id):
    response = requests.get(f'/v1/detail/prompts/{item_id}/history')
    return response.json()
```

#### After
```python
def get_prompt_history(prompt_id):
    response = requests.get(f'/v1/detail/prompts/{prompt_id}/history')
    data = response.json()
    return data['prompt_id']

def get_template_history(template_id):
    response = requests.get(f'/v1/detail/templates/{template_id}/history')
    data = response.json()
    return data['template_id']

# Generic function that handles both types
def get_history(item_id, item_type):
    endpoint = f'/v1/detail/{item_type}s/{item_id}/history'
    response = requests.get(endpoint)
    data = response.json()
    return data[f'{item_type}_id']
```

### cURL

#### Before
```bash
curl http://localhost:8000/v1/detail/prompts/01HQXYZ123/history
```

#### After (Prompts)
```bash
curl http://localhost:8000/v1/detail/prompts/01HQXYZ123/history
```

#### After (Templates)
```bash
curl http://localhost:8000/v1/detail/templates/01HQABC456/history
```

## Affected Endpoints

All endpoints in the following categories are affected:

### Detail API
- `/history`
- `/diff`
- `/raw`
- `/releases`

### Simple API
- `/timeline`
- `/content`
- `/save`
- `/publish`
- `/compare`
- `/rollback`

## Backward Compatibility

### Common API (Search)
The search API maintains backward compatibility. If you don't specify a `type` parameter, it will search both prompts and templates:

```bash
# This still works and searches both types
GET /v1/search?labels=production

# But you can now filter by type
GET /v1/search?type=prompt&labels=production
```

### Other APIs
The URL structure has changed, so you need to update your code to use the new endpoints. There is no automatic redirect from old URLs to new URLs.

## Testing Your Migration

Use the provided test script to verify your API implementation:

```bash
python test_api_endpoints.py
```

## Common Issues

### Issue: 404 Not Found
**Problem:** Using old URL pattern
```
GET /v1/detail/prompts/01HQXYZ123/history  # Old way
```

**Solution:** Specify whether it's a prompt or template
```
GET /v1/detail/prompts/01HQXYZ123/history  # For prompts
GET /v1/detail/templates/01HQXYZ123/history  # For templates
```

### Issue: Missing field in response
**Problem:** Looking for generic `id` field
```json
{
  "id": "..."  // This field no longer exists
}
```

**Solution:** Use type-specific field
```json
{
  "prompt_id": "..."     // For prompts
  "template_id": "..."   // For templates
}
```

## Need Help?

If you encounter any issues during migration:

1. Check the [API_ENDPOINTS.md](API_ENDPOINTS.md) for complete endpoint documentation
2. Run the test suite: `python test_api_endpoints.py`
3. Review your item's frontmatter `type` field to confirm if it's a `prompt` or `template`

## Summary Checklist

- [ ] Update all Detail API URLs to use `/prompts/` or `/templates/`
- [ ] Update all Simple API URLs to use `/prompts/` or `/templates/`
- [ ] Update response parsing to use `prompt_id` or `template_id`
- [ ] Update search queries to use `type` parameter where needed
- [ ] Test all API calls with the test script
- [ ] Update any documentation or API clients
