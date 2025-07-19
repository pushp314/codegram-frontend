import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { requireAuth } from "~/utils/auth.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  await requireAuth(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";
  const cookie = request.headers.get("Cookie");

  const docData = {
    title: formData.get("title"),
    description: formData.get("description"),
    content: formData.get("content"),
    tags: formData.get("tags")?.toString().split(",").map(tag => tag.trim()).filter(Boolean) || [],
    isPublic: formData.get("isPublic") === "on",
  };

  try {
    const response = await fetch(`${BACKEND_URL}/api/docs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie || "",
      },
      credentials: "include",
      body: JSON.stringify(docData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { error: error.error || "Failed to create documentation" };
    }

    const doc = await response.json();
    return redirect(`/docs/${doc.id}`);
  } catch (error) {
    return { error: "Network error. Please try again." };
  }
}

export default function NewDocumentation() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [content, setContent] = useState("");
  
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create New Documentation</h1>
          <p className="text-gray-600 mt-1">Share comprehensive guides and documentation with the community</p>
        </div>
        
        <Form method="post" className="p-6 space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">{actionData.error}</div>
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter documentation title..."
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Brief description of your documentation..."
            />
            <p className="text-sm text-gray-500 mt-1">This will be shown in search results and documentation lists</p>
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <div className="mb-2">
              <p className="text-sm text-gray-600">
                You can use Markdown syntax for formatting. 
                <span className="font-medium"> Bold text</span>, 
                <span className="italic"> italic text</span>, 
                <code className="bg-gray-100 px-1 rounded"> inline code</code>, etc.
              </p>
            </div>
            <textarea
              id="content"
              name="content"
              required
              rows={20}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
              placeholder="# Your Documentation Title

## Introduction

Start writing your documentation here...

## Installation

```bash
npm install your-package
```

## Usage

```javascript
const example = require('your-package');
example.doSomething();
```

## API Reference

### Method Name

Description of the method...

## Examples

Provide some examples...

## Contributing

Instructions for contributors...
"
            />
            <div className="mt-2 text-sm text-gray-500">
              {content.length} characters
            </div>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter tags separated by commas (e.g., React, Tutorial, Beginner)"
            />
            <p className="text-sm text-gray-500 mt-1">Tags help others find your documentation</p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              defaultChecked
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
              Make this documentation public
            </label>
          </div>

          {/* Preview Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
            <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
              {content ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {content.substring(0, 500)}{content.length > 500 ? '...' : ''}
                  </pre>
                </div>
              ) : (
                <p className="text-gray-500 italic">Start typing to see a preview...</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Documentation"}
            </button>
          </div>
        </Form>
      </div>

      {/* Markdown Help */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Markdown Formatting Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Headers</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs">
# Heading 1
## Heading 2  
### Heading 3
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Text Formatting</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs">
**bold text**
*italic text*
`inline code`
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Lists</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs">
- Item 1
- Item 2
1. Numbered item
2. Another item
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Code Blocks</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs">
```javascript
const example = "code";
console.log(example);
```
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Links</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs">
[Link text](https://example.com)
            </pre>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Images</h4>
            <pre className="bg-gray-100 p-2 rounded text-xs">
![Alt text](image-url.jpg)
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}