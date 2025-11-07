# API Changes Summary - Prompt & Template Distinction

## Overview

This document summarizes the changes made to distinguish between prompts and templates in both backend and frontend of the MyPromptManager application.

## What Changed

### Backend Changes

**1. Separate API Endpoints**
- All endpoints now have separate routes for `prompts` and `templates`
- Example: `/v1/detail/prompts/{id}/history` and `/v1/detail/templates/{id}/history`

**2. View Updates**
- All views now accept both `prompt_id` and `template_id` parameters
- Views automatically detect which parameter is provided and set the item type accordingly

**3. Response Format**
- Prompt endpoints return `prompt_id` in responses
- Template endpoints return `template_id` in responses

### Frontend Changes

**1. API Service Layer**
- Added type parameter to all API methods
- Provided both generic and type-specific method variants
- Maintained backward compatibility

**2. Pages and Components**
- Updated to detect and pass item type from URL parameters
- All API calls now include the item type
- Navigation URLs include `?type=` parameter

**3. URL Structure**
- Detail pages now accept `?type=prompt` or `?type=template` query parameter
- Defaults to 'prompt' if not specified

## Files Modified

### Backend
- [apps/api_detail/urls.py](apps/api_detail/urls.py) - Added template routes
- [apps/api_detail/views.py](apps/api_detail/views.py) - Updated views to support both types
- [apps/api_simple/urls.py](apps/api_simple/urls.py) - Added template routes
- [apps/api_simple/views.py](apps/api_simple/views.py) - Updated views to support both types
- Search API already supported type filtering

### Frontend
- [frontend/src/lib/api.js](frontend/src/lib/api.js) - Updated API service
- [frontend/src/pages/PromptDetail.jsx](frontend/src/pages/PromptDetail.jsx) - Added type detection
- [frontend/src/pages/PromptsList.jsx](frontend/src/pages/PromptsList.jsx) - Added type to navigation
- [frontend/src/components/modals/PublishModal.jsx](frontend/src/components/modals/PublishModal.jsx) - Added itemType prop
- [frontend/src/components/modals/RollbackModal.jsx](frontend/src/components/modals/RollbackModal.jsx) - Added itemType prop

### Documentation
- [API_ENDPOINTS.md](API_ENDPOINTS.md) - Complete API endpoint documentation
- [API_MIGRATION_GUIDE.md](API_MIGRATION_GUIDE.md) - Backend migration guide
- [FRONTEND_MIGRATION.md](FRONTEND_MIGRATION.md) - Frontend migration guide
- [test_api_endpoints.py](test_api_endpoints.py) - API test script

## Key Features

### ✅ Backward Compatibility
- All existing code continues to work
- Default type is 'prompt' when not specified
- Old URL patterns still supported

### ✅ Type Safety
- Clear distinction between prompts and templates
- Type information flows through entire request lifecycle
- Proper error messages when wrong type is used

### ✅ Flexible API
- Generic methods with type parameter
- Type-specific methods for explicit typing
- Supports dynamic type determination

## API Examples

### Backend

**Get Prompt History:**
```bash
GET /v1/detail/prompts/01HQXYZ123/history
```

Response:
```json
{
  "prompt_id": "01HQXYZ123",
  "file_path": "prompts/prompt_01HQXYZ123.md",
  "history": [...]
}
```

**Get Template History:**
```bash
GET /v1/detail/templates/01HQABC456/history
```

Response:
```json
{
  "template_id": "01HQABC456",
  "file_path": "templates/template_01HQABC456.md",
  "history": [...]
}
```

**Search by Type:**
```bash
GET /v1/search?type=prompt
GET /v1/search?type=template
```

### Frontend

**Generic Method:**
```javascript
// Dynamically handle both types
const itemType = 'prompt' // or 'template'
const response = await simpleApi.getContent(id, itemType, { ref: 'latest' })
```

**Type-Specific Method:**
```javascript
// Explicitly for prompts
const response = await simpleApi.prompt.getContent(id, { ref: 'latest' })

// Explicitly for templates
const response = await simpleApi.template.getContent(id, { ref: 'latest' })
```

**Navigation:**
```javascript
// Navigate to prompt detail
navigate(`/prompts/${id}?type=prompt`)

// Navigate to template detail
navigate(`/prompts/${id}?type=template`)
```

## Testing

### Backend Tests
Run the API test script:
```bash
python test_api_endpoints.py
```

Expected results:
- ✅ All URL patterns resolve correctly
- ✅ Views accept prompt_id and template_id parameters
- ✅ Responses contain appropriate ID fields
- ✅ Search filters by type correctly

### Frontend Testing
Manual test checklist:
1. View prompt details: `/prompts/{id}?type=prompt`
2. View template details: `/prompts/{id}?type=template`
3. List view with type filter
4. Publish/rollback operations for both types
5. Navigation between items

## Migration Path

### For Existing API Clients

**Option 1: Update to new endpoints (recommended)**
```javascript
// Old
GET /v1/detail/prompts/{id}/history

// New (explicit type)
GET /v1/detail/prompts/{id}/history  // For prompts
GET /v1/detail/templates/{id}/history  // For templates
```

**Option 2: Use search API with type filter**
```javascript
// Search only prompts
GET /v1/search?type=prompt

// Search only templates
GET /v1/search?type=template
```

### For Frontend Developers

1. Update imports:
```javascript
import { simpleApi, detailApi } from '@/lib/api'
```

2. Add type to API calls:
```javascript
// Before
await simpleApi.getContent(id, params)

// After
await simpleApi.getContent(id, 'prompt', params)
// or
await simpleApi.getContent(id, itemType, params)
```

3. Include type in navigation:
```javascript
// Before
navigate(`/prompts/${id}`)

// After
navigate(`/prompts/${id}?type=${item.type || 'prompt'}`)
```

## Benefits

### 1. Clear Separation
- Prompts and templates are now clearly distinguished in the API
- No ambiguity about which type of resource is being accessed

### 2. Better Type Safety
- Backend validates that the correct type is being accessed
- Frontend can properly handle type-specific logic

### 3. Improved Scalability
- Easy to add new resource types in the future
- Pattern can be extended to other content types (e.g., chat, workflow)

### 4. Better Developer Experience
- Explicit API calls make code more readable
- Type information available throughout the stack
- Better error messages when wrong type is used

## Next Steps

### Recommended Enhancements

1. **Add TypeScript definitions** for frontend API
2. **Create type-specific components** (PromptEditor, TemplateEditor)
3. **Add type badges** in UI to visually distinguish items
4. **Implement type-specific validation** rules
5. **Add type-specific search filters** in advanced search

### Future Considerations

1. Consider adding more content types (chat, workflow, etc.)
2. Implement type-specific features (e.g., variable placeholders for templates)
3. Add type conversion utilities (prompt to template, etc.)
4. Create type-specific analytics and reporting

## Support

For questions or issues:

1. Check the documentation:
   - [API_ENDPOINTS.md](API_ENDPOINTS.md)
   - [API_MIGRATION_GUIDE.md](API_MIGRATION_GUIDE.md)
   - [FRONTEND_MIGRATION.md](FRONTEND_MIGRATION.md)

2. Run tests:
   ```bash
   python test_api_endpoints.py
   ```

3. Review code examples in this document

## Changelog

### Version 1.1.0 (Current)
- ✅ Added separate endpoints for prompts and templates
- ✅ Updated all backend views to support type distinction
- ✅ Updated frontend API service with type-aware methods
- ✅ Updated pages and components to handle types
- ✅ Maintained backward compatibility
- ✅ Added comprehensive documentation
- ✅ Created test suite

### Version 1.0.0 (Previous)
- Single generic endpoints for all items
- No type distinction in API
- Limited type filtering capabilities
