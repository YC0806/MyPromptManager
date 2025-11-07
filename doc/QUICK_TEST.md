# Quick Test Guide - API Integration

This guide helps you quickly test the integrated prompt/template API changes.

## Prerequisites

1. Backend server running: `python manage.py runserver`
2. Frontend server running: `cd frontend && npm run dev`
3. Git repository initialized in the project root

## Quick Backend Test

### 1. Run Automated Tests

```bash
python test_api_endpoints.py
```

Expected output:
```
============================================================
API Endpoint Tests - Prompt/Template Distinction
============================================================

=== Testing URL Patterns ===
✓ detail-prompt-history URL: /v1/detail/prompts/test-id/history
✓ detail-template-history URL: /v1/detail/templates/test-id/history
✓ simple-prompt-timeline URL: /v1/simple/prompts/test-id/timeline
✓ simple-template-timeline URL: /v1/simple/templates/test-id/timeline
✓ common-search URL: /v1/search

... (more tests)
```

### 2. Manual API Tests

**Test Prompt Endpoints:**
```bash
# Search prompts only
curl http://localhost:8000/v1/search?type=prompt

# Get prompt history (replace with actual ID)
curl http://localhost:8000/v1/detail/prompts/YOUR_PROMPT_ID/history
```

**Test Template Endpoints:**
```bash
# Search templates only
curl http://localhost:8000/v1/search?type=template

# Get template history (replace with actual ID)
curl http://localhost:8000/v1/detail/templates/YOUR_TEMPLATE_ID/history
```

## Quick Frontend Test

### 1. Open Browser Developer Console

Navigate to: `http://localhost:5173`

### 2. Test API Service

Open browser console and run:

```javascript
// Test importing API
import { simpleApi, detailApi, commonApi } from './src/lib/api.js'

// Test search (should work immediately)
fetch('/v1/search?type=prompt')
  .then(r => r.json())
  .then(d => console.log('Prompts:', d))

fetch('/v1/search?type=template')
  .then(r => r.json())
  .then(d => console.log('Templates:', d))
```

### 3. Test Navigation

1. Go to the prompts list page
2. Click on any prompt
3. Check URL contains `?type=prompt` or `?type=template`
4. Verify detail page loads correctly

### 4. Test Modals

1. Open a prompt/template detail page
2. Click "Publish" button
3. Verify modal opens (should not crash)
4. Cancel and try "Rollback" button
5. Verify rollback modal opens

## Integration Test Checklist

### Backend ✅

- [ ] Server starts without errors: `python manage.py runserver`
- [ ] Django check passes: `python manage.py check`
- [ ] Test script runs successfully: `python test_api_endpoints.py`
- [ ] Prompt endpoints respond: `curl http://localhost:8000/v1/search?type=prompt`
- [ ] Template endpoints respond: `curl http://localhost:8000/v1/search?type=template`

### Frontend ✅

- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Frontend dev server starts: `npm run dev`
- [ ] No console errors on page load
- [ ] Prompts list page loads
- [ ] Can navigate to prompt detail with `?type=prompt`
- [ ] Can navigate to template detail with `?type=template`
- [ ] Publish modal accepts itemType prop
- [ ] Rollback modal accepts itemType prop

### Integration ✅

- [ ] Frontend can fetch prompts: `GET /v1/search?type=prompt`
- [ ] Frontend can fetch templates: `GET /v1/search?type=template`
- [ ] Navigation passes type parameter correctly
- [ ] Detail page loads correct type
- [ ] Save draft works with type
- [ ] Publish works with type
- [ ] Rollback works with type

## Common Issues & Solutions

### Issue: 404 on API calls
**Symptom:** API returns 404 Not Found
**Solution:**
- Check URL includes correct type: `/prompts/` or `/templates/`
- Verify backend server is running
- Check test_api_endpoints.py output for URL patterns

### Issue: Frontend console errors
**Symptom:** Console shows "Cannot read property 'type' of undefined"
**Solution:**
- Ensure metadata.type has a default value
- Check that item type is passed in URL: `?type=prompt`
- Verify API response includes metadata

### Issue: Modals crash when opening
**Symptom:** "itemType is not defined" error
**Solution:**
- Pass itemType prop to modals: `<PublishModal itemType={metadata.type} />`
- Ensure metadata.type is set before modal opens

### Issue: Search returns empty results
**Symptom:** Search API returns empty array
**Solution:**
- Check if index is built: `curl http://localhost:8000/v1/index/status`
- Rebuild index: `curl -X POST http://localhost:8000/v1/index/rebuild`
- Verify there are .md files in prompts/ or templates/ directories

## Debugging Tips

### Backend Debugging

1. **Check Django logs:**
```bash
python manage.py runserver
# Watch console output for errors
```

2. **Test URL routing:**
```python
from django.urls import reverse
print(reverse('detail-prompt-history', kwargs={'prompt_id': 'test'}))
print(reverse('detail-template-history', kwargs={'template_id': 'test'}))
```

3. **Test views directly:**
```bash
python manage.py shell
from apps.api_detail.views import HistoryView
# Test view logic
```

### Frontend Debugging

1. **Check API calls in Network tab:**
- Open DevTools → Network
- Filter by XHR/Fetch
- Verify URLs include correct type path

2. **Console log API responses:**
```javascript
// In component
console.log('Item type:', metadata.type)
console.log('API call:', simpleApi.getContent(id, metadata.type))
```

3. **Verify state:**
```javascript
// In React DevTools
// Check PromptDetail component state
// Verify metadata.type is set
```

## Quick Smoke Test Script

Save this as `smoke_test.sh`:

```bash
#!/bin/bash

echo "🧪 Starting Smoke Test..."

# Test backend
echo "1. Testing backend health..."
curl -s http://localhost:8000/v1/health | grep "healthy" && echo "✅ Backend healthy" || echo "❌ Backend unhealthy"

# Test prompt endpoints
echo "2. Testing prompt endpoints..."
curl -s http://localhost:8000/v1/search?type=prompt > /dev/null && echo "✅ Prompt search works" || echo "❌ Prompt search failed"

# Test template endpoints
echo "3. Testing template endpoints..."
curl -s http://localhost:8000/v1/search?type=template > /dev/null && echo "✅ Template search works" || echo "❌ Template search failed"

# Test frontend
echo "4. Testing frontend..."
curl -s http://localhost:5173 > /dev/null && echo "✅ Frontend accessible" || echo "❌ Frontend not accessible"

echo "🎉 Smoke test complete!"
```

Run it:
```bash
chmod +x smoke_test.sh
./smoke_test.sh
```

## Success Criteria

Your integration is working correctly if:

1. ✅ All automated tests pass
2. ✅ Backend responds to both prompt and template endpoints
3. ✅ Frontend loads without console errors
4. ✅ Navigation includes type parameter
5. ✅ Detail pages load correct content
6. ✅ Modals open without crashing
7. ✅ API calls include correct type path

## Next Steps After Testing

Once all tests pass:

1. Review [API_ENDPOINTS.md](API_ENDPOINTS.md) for complete API reference
2. Check [FRONTEND_MIGRATION.md](FRONTEND_MIGRATION.md) for frontend patterns
3. Read [API_CHANGES_SUMMARY.md](API_CHANGES_SUMMARY.md) for overview
4. Start using type-specific features in your development

## Need Help?

If tests fail:

1. Check error messages carefully
2. Review the documentation files
3. Verify backend and frontend servers are running
4. Check that you're using the latest code
5. Look at the code examples in migration guides

Happy testing! 🚀
