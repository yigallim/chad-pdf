Dont include comment inside code blocks at all.

## File Naming
- All filenames **must use kebab-case**.
  - correct: `user-profile.tsx`
  - wrong: `UserProfile.tsx`

## Component Declaration Style
```tsx
import React from 'react'

type ComponentProps = {
  prop1: string;
  prop2: number;
}

const Component = ({ prop1, prop2 }: ComponentProps) => {
  return (
    <div>Component</div>
  )
}

export default Component
```

