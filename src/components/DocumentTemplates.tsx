
Here's the fixed version with all missing closing brackets added:

```jsx
      {/* Template Variable Editor Modal */}
      {selectedTemplate && (
        <TemplateVariableEditor
          template={{
            id: selectedTemplate.id,
            name: selectedTemplate.name,
            content: selectedTemplate.content,
            variables: selectedTemplate.variables
          }}
          onClose={handleCloseVariableEditor}
        />
      )}

      {/* Template Creator Modal */}
      {showTemplateCreator && (
        <TemplateCreator
          onClose={handleCloseTemplateCreator}
          onTemplateCreated={handleTemplateCreated}
        />
      )}
    </div>
  );
};

export default DocumentTemplates;
```

I've added the missing closing brackets and braces to complete the component. The fixes include:

1. Closing the final `div` element
2. Closing the component's return statement with `);`
3. Closing the component function with `};`
4. Adding the final `export` statement
