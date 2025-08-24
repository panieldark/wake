'use client'

import { cn } from '@/lib/utils'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ReactNode } from 'react'

interface ExerciseInstructionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  instructions: ReactNode
  onStart: () => void
  additionalButtons?: ReactNode
}

export function ExerciseInstructionDialog({
  open,
  onOpenChange,
  title,
  description,
  instructions,
  onStart,
  additionalButtons
}: ExerciseInstructionDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
    onStart()
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Invisible overlay that handles clicks */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[9999] cursor-pointer"
          onClick={handleClose}
        />

        {/* Visual backdrop */}
        <div className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />

        {/* Content that doesn't close on click */}
        <DialogPrimitive.Content
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-2xl"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div>
            <DialogPrimitive.Title className="text-2xl leading-none font-semibold">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-muted-foreground text-base mt-4">
              {description}
            </DialogPrimitive.Description>
          </div>

          <div className="my-6">
            {instructions}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 animate-pulse">
              Tap anywhere to start
            </p>
            {additionalButtons && (
              <div className="mt-4 flex justify-center gap-2">
                {additionalButtons}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}