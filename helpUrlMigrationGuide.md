# Help URL Migration Guide

This guide shows how to replace hardcoded help.mingdao.com URLs with the centralized helpUrls.js configuration.

## Step 1: Import the helper functions

```javascript
// Import the helper functions at the top of your file
import { getHelpUrl } from 'src/common/helpUrls';
```

## Step 2: Replace hardcoded URLs

Replace hardcoded URLs like this:

```javascript
// Before:
href="https://help.mingdao.com/worksheet/control-select"

// After:
href={getHelpUrl('worksheet', 'select')}
```

## Files that need updating

### src/ming-ui/components/Support.jsx

```javascript
// Original: 'https://help.mingdao.com'
// No mapping found for path: /
// Add this path to helpUrls.js and then use getHelpUrl()
```

```javascript
// Original: 'https://help.mingdao.com'
// No mapping found for path: /
// Add this path to helpUrls.js and then use getHelpUrl()
```

