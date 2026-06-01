// utils/renderMarkdownTemplate.tsx
import moment from 'moment';
import Link from 'next/link';
import React from 'react';

type Variables = Record<string, any>;

function resolveVariable(path: string, data: Variables): any {
  return path.split('.').reduce((acc, key) => acc?.[key] ?? '', data);
}

function interpolateVariables(text: string, variables: Variables): string {
  return text.replace(/{(.+?)}/g, (_, key) => {
    const rawText = resolveVariable(key, variables)
    const isValidDate = moment(rawText).isValid();
    return isValidDate ? moment(rawText).format('L') : rawText;
  });
}

export function renderMarkdownTemplate(template: string, variables: Variables) {
  const interpolated = interpolateVariables(template, variables);
  const elements = parseMarkdown(interpolated);
  return <>{elements}</>;
}

function parseMarkdown(text: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let index = 0;

  // Match link: [text](url), bold: **text**, italic: *text*
  const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*(.*?)\*\*|\*(.*?)\*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > index) {
      elements.push(text.slice(index, match.index));
    }

    if (match[1] && match[2]) {
      // Link
      elements.push(
        <Link key={elements.length} href={match[2]} className="font-semibold hover:underline">
          {match[1]}
        </Link>
      );
    } else if (match[3]) {
      // Bold
      elements.push(
        <strong key={elements.length} className="font-semibold">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Italic
      elements.push(
        <em key={elements.length} className="italic">
          {match[4]}
        </em>
      );
    }

    index = regex.lastIndex;
  }

  if (index < text.length) {
    elements.push(text.slice(index));
  }

  return elements;
}
