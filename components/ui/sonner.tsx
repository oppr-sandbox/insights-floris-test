"use client"

import { useTheme } from "next-themes"
import { ExternalToast, Toaster as Sonner, toast as sonnerToast, ToasterProps } from "sonner"

type PromiseT<Data = any> = Promise<Data> | (() => Promise<Data>);
interface PromiseIExtendedResult extends ExternalToast {
    message: React.ReactNode;
}
type PromiseTExtendedResult<Data = any> = PromiseIExtendedResult | ((data: Data) => PromiseIExtendedResult | Promise<PromiseIExtendedResult>);
type PromiseTResult<Data = any> = string | React.ReactNode | ((data: Data) => React.ReactNode | string | Promise<React.ReactNode | string>);
type PromiseExternalToast = Omit<ExternalToast, 'description'>;
type PromiseData<ToastData = any> = PromiseExternalToast & {
    loading?: string | React.ReactNode;
    success?: PromiseTResult<ToastData> | PromiseTExtendedResult<ToastData>;
    error?: PromiseTResult | PromiseTExtendedResult;
    description?: PromiseTResult;
    finally?: () => void | Promise<void>;
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

const toast = {
  default: (message: string, data?: ExternalToast) => {
    sonnerToast(message, data)
  },
  error: (message: string, data?: ExternalToast) => {
      sonnerToast.error(message, {
        style: {
            '--normal-bg': 'color-mix(in oklab, var(--destructive) 10%, var(--background))',
            '--normal-text': 'var(--destructive)',
            '--normal-border': 'var(--destructive)'
        } as React.CSSProperties,
        ...data
    });
  },
  warning: (message: string, data?: ExternalToast) => {
      sonnerToast.warning(message, {
        style: {
            '--normal-bg':
              'color-mix(in oklab, light-dark(var(--color-amber-600), var(--color-amber-400)) 10%, var(--background))',
            '--normal-text': 'light-dark(var(--color-amber-600), var(--color-amber-400))',
            '--normal-border': 'light-dark(var(--color-amber-600), var(--color-amber-400))'
          } as React.CSSProperties,
        ...data
    });
  },
  success: (message: string, data?: ExternalToast) => {
      sonnerToast.success(message, {
        style: {
            '--normal-bg':
              'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
            '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
          } as React.CSSProperties,
        ...data
    });
  },
  promise: (promise: PromiseT<any>, data?: PromiseData<any>) => {
    sonnerToast.promise(promise, {
      ...data
    })
  }
}

export { Toaster, toast }
