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

### src/pages/workflow/WorkflowList/AppWorkflowList.jsx

```javascript
// Original: 'https://help.mingdao.com/workflow/pbp'
// No mapping found for path: /workflow/pbp
// Add this path to helpUrls.js and then use getHelpUrl()
```

```javascript
// Original: 'https://help.mingdao.com/workflow/create'
// No mapping found for path: /workflow/create
// Add this path to helpUrls.js and then use getHelpUrl()
```

```javascript
// Original: "https://help.mingdao.com/workflow/create"
// No mapping found for path: /workflow/create
// Add this path to helpUrls.js and then use getHelpUrl()
```

### src/pages/workflow/WorkflowSettings/Detail/AIGC/index.jsx

```javascript
// Original: "https://help.mingdao.com/purchase/billing-items"
// No mapping found for path: /purchase/billing-items
// Add this path to helpUrls.js and then use getHelpUrl()
```

### src/pages/workflow/WorkflowSettings/Detail/CC/index.jsx

```javascript
// Original: "https://help.mingdao.com/workflow/node-cc-send-internal-notification"
// No mapping found for path: /workflow/node-cc-send-internal-notification
// Add this path to helpUrls.js and then use getHelpUrl()
```

### src/pages/publicWorksheetConfig/common/PayConfig/index.js

```javascript
// Original: "https://help.mingdao.com/org/payment"
// No mapping found for path: /org/payment
// Add this path to helpUrls.js and then use getHelpUrl()
```

### src/pages/AuthService/register/container/add.jsx

```javascript
// Original: "https://help.mingdao.com/org/id"
// No mapping found for path: /org/id
// Add this path to helpUrls.js and then use getHelpUrl()
```

### src/pages/plugin/config.js

```javascript
// Original: 'https://help.mingdao.com/extensions/developer/view'
// No mapping found for path: /extensions/developer/view
// Add this path to helpUrls.js and then use getHelpUrl()
```

```javascript
// Original: 'https://help.mingdao.com/extensions/developer/view'
// No mapping found for path: /extensions/developer/view
// Add this path to helpUrls.js and then use getHelpUrl()
```

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

