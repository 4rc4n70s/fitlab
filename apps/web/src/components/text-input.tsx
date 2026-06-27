import React from 'react'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`bg-background text-foreground border border-border px-4 py-2 h-10 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow ${className}`}
        {...props}
      />
    )
  }
)

TextInput.displayName = 'TextInput'
