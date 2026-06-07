```markdown
# CubeMate Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches best practices for contributing to the CubeMate codebase, a React application written in TypeScript. It covers core coding conventions, file organization, import/export styles, and testing patterns observed in the repository. By following these guidelines, contributors can maintain consistency and code quality across the project.

## Coding Conventions

### File Naming
- Use **PascalCase** for all file and component names.
  - Example: `UserProfile.tsx`, `DashboardView.ts`

### Import Style
- Use **relative imports** for referencing modules within the codebase.
  - Example:
    ```typescript
    import { UserProfile } from './UserProfile';
    ```

### Export Style
- Use **named exports** for all modules and components.
  - Example:
    ```typescript
    // UserProfile.tsx
    export const UserProfile = () => { /* ... */ };
    ```

### Commit Patterns
- Commit messages are **freeform** (no enforced type or scope).
- Some commits use prefixes, but not consistently.
- Average commit message length: **58 characters**.

## Workflows

_No automated or CI workflows detected in the repository._

## Testing Patterns

- **Testing Framework:** Not explicitly detected.
- **Test File Pattern:** Test files are named using the `*.test.*` convention.
  - Example: `UserProfile.test.tsx`
- Place test files alongside the modules they test or in a dedicated `__tests__` directory.

### Example Test File
```typescript
// UserProfile.test.tsx
import { render } from '@testing-library/react';
import { UserProfile } from './UserProfile';

test('renders user profile', () => {
  render(<UserProfile />);
  // Add assertions here
});
```

## Commands
| Command | Purpose |
|---------|---------|
| /new-component | Scaffold a new PascalCase component with named export |
| /run-tests     | Run all test files matching *.test.* pattern          |
| /format-code   | Format codebase according to conventions              |
```
