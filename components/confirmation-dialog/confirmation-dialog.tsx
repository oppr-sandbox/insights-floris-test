import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { ReactElement } from "react";
import { buttonVariants } from "../ui/button";
import { VariantProps } from "class-variance-authority";

type ConfirmationDialogProps = {
    title: string;
    description: string;
    triggerButton: ReactElement;
    actionButtonText?: string;
    actionButton?: { text: string; } & VariantProps<typeof buttonVariants>;
    cancelButtonText?: string;
    onActionButtonClicked: () => void; 
}

export default function ConfirmationDialog({ 
    title, 
    description, 
    triggerButton, 
    actionButtonText, 
    actionButton,
    cancelButtonText = 'Cancel', 
    onActionButtonClicked 
  } : ConfirmationDialogProps ) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {triggerButton}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelButtonText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onActionButtonClicked} 
            variant={actionButton?.variant ?? 'default'} size="sm">
              {actionButtonText ?? actionButton?.text ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
