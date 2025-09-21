

1/1

Next.js 15.5.3
Turbopack
Build Error

Ecmascript file had an error

./src/components/ui/Input.tsx (1:43)

Ecmascript file had an error
> 1 | import { InputHTMLAttributes, forwardRef, useState } from 'react'
    |                                           ^^^^^^^^
  2 | import { clsx } from 'clsx'
  3 |
  4 | interface InputProps extends InputHTMLAttributes<HTMLInputElement> {

You're importing a component that needs `useState`. This React Hook only works in a Client Component. To fix, mark the file (or its parent) with the `"use client"` directive.

 Learn more: https://nextjs.org/docs/app/api-reference/directives/use-client
