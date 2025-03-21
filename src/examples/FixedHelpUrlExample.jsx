/**
 * Example of how to properly use the centralized helpUrls.js configuration
 * This shows how to migrate hardcoded URLs to use the helper functions.
 */

import React from 'react';
import { getHelpUrl, getHelpUrlFromVersionType, getHelpUrlFromNodeType } from '../common/helpUrls';

// BEFORE MIGRATION:
// The component uses a hardcoded URL directly
// This approach is no longer recommended - use getHelpUrl instead
export function BeforeExample() {
  return (
    <a href={getHelpUrl('worksheet', 'titleField')} target="_blank" rel="noopener noreferrer">
      Learn more about title fields
    </a>
  );
}

// AFTER MIGRATION:
// The component uses the getHelpUrl helper function
export function AfterExample() {
  return (
    <a href={getHelpUrl('worksheet', 'titleField')} target="_blank" rel="noopener noreferrer">
      Learn more about title fields
    </a>
  );
}

// EXAMPLE WITH SUPPORT COMPONENT:
// If you're using the Support component, it already has URL replacement logic built in
import { Support } from '../ming-ui/components/Support';

export function SupportComponentExample() {
  return (
    <Support 
      type={3} 
      href={getHelpUrl('worksheet', 'titleField')}
      text="Learn more about title fields" 
    />
  );
}

// However, the Support component can also be updated to use the getHelpUrl function:
export function ImprovedSupportComponentExample() {
  return (
    <Support 
      type={3} 
      href={getHelpUrl('worksheet', 'titleField')} 
      text="Learn more about title fields" 
    />
  );
}

// This allows the Support component to benefit from the centralized URL system
// while still maintaining its compatibility with md.global.Config.HelpUrl for backwards compatibility.

// EXAMPLE WITH INTERNATIONAL URLs:
// Use the same approach regardless of user's language preference
export function MultiLanguageExample() {
  return (
    <>
      <a href={getHelpUrl('worksheet', 'titleField')} target="_blank" rel="noopener noreferrer">
        Help URL will be properly localized
      </a>
      <p>The base URL is configured in helpUrlConfig.baseUrl in src/common/helpUrls.js</p>
    </>
  );
}

// EXAMPLE USING PRODUCT VERSION TYPE:
// For integration with version product type IDs
export function VersionProductTypeExample() {
  // Product type ID for API integration
  const productTypeId = 3;
  
  return (
    <a href={getHelpUrlFromVersionType(productTypeId)} target="_blank" rel="noopener noreferrer">
      Learn more about this product feature
    </a>
  );
}

// EXAMPLE USING WORKFLOW NODE TYPE:
// For workflow node help documentation
export function WorkflowNodeTypeExample() {
  // Node type for approval node
  const nodeType = 4;
  
  return (
    <a href={getHelpUrlFromNodeType(nodeType)} target="_blank" rel="noopener noreferrer">
      Learn more about approval nodes
    </a>
  );
}