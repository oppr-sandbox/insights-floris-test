import { JSX } from "react"
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable"
import ReactMarkdown from "react-markdown";

type Props = {
  placeholder: string
  className?: string
  placeholderClassName?: string
}

export function ContentEditable({
  placeholder,
  className,
  placeholderClassName,
}: Props): JSX.Element {
  return (
    <LexicalContentEditable
      className={
        className ??
        `ContentEditable__root relative block overflow-auto focus:outline-none`
      }
      aria-placeholder={placeholder}
      placeholder={
        <div
          className={
            placeholderClassName ??
            `text-muted-foreground pointer-events-none absolute p-4 top-0 left-0 overflow-hidden text-ellipsis select-none`
          }
        >
          <ReactMarkdown
            components={{
              ul: ({node, ...props}) => (
                <ul className="list-disc list-inside ml-2" {...props} />
              ),
              ol: ({node, ...props}) => (
                <ol className="list-decimal list-inside ml-2" {...props} />
              ),
            }}>
            {placeholder}
          </ReactMarkdown>
        </div>
      }
    />
  )
}
