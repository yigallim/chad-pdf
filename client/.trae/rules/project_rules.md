Dont include comment inside code blocks at all.

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

