# Frontend Migration Guide - Prompt & Template API Updates

This guide explains the frontend changes made to support the backend API updates that distinguish between prompts and templates.

## Overview

The frontend has been updated to work with the new backend API structure that provides separate endpoints for prompts and templates. All API calls now properly specify the item type.

## Changes Made

### 1. API Service Layer ([frontend/src/lib/api.js](frontend/src/lib/api.js))

#### New API Structure

The API service now provides three ways to call endpoints:

**1. Generic methods with type parameter (recommended):**
```javascript
// Generic method - type defaults to 'prompt'
simpleApi.getContent(id, type, params)
detailApi.getHistory(id, type, params)
```

**2. Type-specific nested methods:**
```javascript
// Prompt-specific
simpleApi.prompt.getContent(id, params)
detailApi.prompt.getHistory(id, params)

// Template-specific
simpleApi.template.getContent(id, params)
detailApi.template.getHistory(id, params)
```

**3. Backward-compatible methods:**
```javascript
// Still works, defaults to 'prompt'
simpleApi.getContent(id, params)
detailApi.getHistory(id, params)
```

#### Updated API Methods

**Simple API:**
- `getTimeline(id, type, params)` - Get timeline for item
- `getContent(id, type, params)` - Get content of item
- `saveDraft(id, type, data)` - Save draft
- `publish(id, type, data)` - Publish version
- `compare(id, type, params)` - Compare versions
- `rollback(id, type, data)` - Rollback version

**Detail API:**
- `getHistory(id, type, params)` - Get commit history
- `getDiff(id, type, params)` - Get diff between refs
- `getRaw(id, type, params)` - Get raw markdown
- `updateRaw(id, type, data, etag)` - Update raw markdown
- `getReleases(id, type)` - Get releases
- `createRelease(id, type, data)` - Create release

### 2. Pages Updates

#### PromptDetail ([frontend/src/pages/PromptDetail.jsx](frontend/src/pages/PromptDetail.jsx))

**Added:**
- Type detection from URL parameters (`?type=prompt` or `?type=template`)
- Type stored in metadata state
- All API calls now pass the item type

**Before:**
```javascript
const response = await simpleApi.getContent(id, { ref: 'latest' })
await simpleApi.saveDraft(id, { content, message: 'Draft saved' })
```

**After:**
```javascript
const itemType = searchParams.get('type') || 'prompt'
const response = await simpleApi.getContent(id, itemType, { ref: 'latest' })
await simpleApi.saveDraft(id, metadata.type, { content, message: 'Draft saved' })
```

#### PromptsList ([frontend/src/pages/PromptsList.jsx](frontend/src/pages/PromptsList.jsx))

**Added:**
- Type parameter to navigation URLs

**Before:**
```javascript
navigate(`/prompts/${prompt.id}`)
```

**After:**
```javascript
navigate(`/prompts/${prompt.id}?type=${prompt.type || 'prompt'}`)
```

### 3. Component Updates

#### PublishModal ([frontend/src/components/modals/PublishModal.jsx](frontend/src/components/modals/PublishModal.jsx))

**Added:**
- `itemType` prop (defaults to 'prompt')
- Type passed to API calls

**Usage:**
```javascript
<PublishModal
  open={showPublishModal}
  onClose={() => setShowPublishModal(false)}
  promptId={id}
  itemType={metadata.type}
/>
```

#### RollbackModal ([frontend/src/components/modals/RollbackModal.jsx](frontend/src/components/modals/RollbackModal.jsx))

**Added:**
- `itemType` prop (defaults to 'prompt')
- Type passed to API calls

**Usage:**
```javascript
<RollbackModal
  open={showRollbackModal}
  onClose={() => setShowRollbackModal(false)}
  promptId={id}
  itemType={metadata.type}
/>
```

## Migration Checklist for Developers

If you're updating existing code or adding new features:

- [ ] Use the generic API methods with type parameter
- [ ] Pass item type in URL query params when navigating
- [ ] Store item type in component state from URL or API response
- [ ] Pass item type to all modal components
- [ ] Update any hardcoded 'prompt' references to use dynamic type

## Code Examples

### Fetching Content

```javascript
// In a component
const { id } = useParams()
const [itemType, setItemType] = useState('prompt')

useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search)
  const type = searchParams.get('type') || 'prompt'
  setItemType(type)

  loadContent(id, type)
}, [id])

const loadContent = async (id, type) => {
  const response = await simpleApi.getContent(id, type, { ref: 'latest' })
  // Process response
}
```

### Navigation with Type

```javascript
// When clicking on an item in a list
const handleItemClick = (item) => {
  navigate(`/prompts/${item.id}?type=${item.type || 'prompt'}`)
}
```

### Using Type-Specific Methods

```javascript
// For prompts only
const promptHistory = await detailApi.prompt.getHistory(promptId)

// For templates only
const templateHistory = await detailApi.template.getHistory(templateId)

// Generic (when type is dynamic)
const history = await detailApi.getHistory(id, itemType)
```

## URL Structure

All detail pages now support the `type` query parameter:

```
/prompts/{id}?type=prompt
/prompts/{id}?type=template
```

If the type parameter is omitted, it defaults to `'prompt'` for backward compatibility.

## API Response Changes

The backend now returns different ID fields based on the type:

**For Prompts:**
```json
{
  "prompt_id": "01HQXYZ123",
  "content": "...",
  "metadata": { ... }
}
```

**For Templates:**
```json
{
  "template_id": "01HQABC456",
  "content": "...",
  "metadata": { ... }
}
```

Make sure to handle both field names when processing responses:

```javascript
const itemId = data.prompt_id || data.template_id
```

## Testing

Test the following scenarios:

1. **View a prompt:**
   - Navigate to `/prompts/{id}?type=prompt`
   - Verify content loads correctly
   - Check that save/publish operations work

2. **View a template:**
   - Navigate to `/prompts/{id}?type=template`
   - Verify content loads correctly
   - Check that save/publish operations work

3. **List view:**
   - Verify clicking items navigates with correct type parameter
   - Check that filter by type works (prompt/template/all)

4. **Publish/Rollback:**
   - Verify modals accept item type
   - Check API calls include correct type

## Common Issues

### Issue: Type not passed to API
**Problem:** API calls fail with 404
**Solution:** Ensure type parameter is passed to all API methods

### Issue: Navigation doesn't include type
**Problem:** Detail page loads wrong item type
**Solution:** Add `?type=${item.type}` to navigation URLs

### Issue: Modals don't have itemType prop
**Problem:** Publish/rollback fails
**Solution:** Pass `itemType={metadata.type}` to modal components

## Future Considerations

When adding new features:

1. Always consider whether the feature works for both prompts and templates
2. Use the generic API methods with type parameter for flexibility
3. Store and pass item type throughout the component hierarchy
4. Test with both item types

## Summary

The frontend now fully supports the backend's distinction between prompts and templates:

- ✅ API service updated with type-aware methods
- ✅ Pages updated to detect and use item type
- ✅ Components updated to accept and pass item type
- ✅ Navigation includes type information
- ✅ Backward compatibility maintained with defaults

All changes are backward compatible - existing code continues to work with prompts as the default type.
