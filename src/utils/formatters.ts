/**
 * Utilities for converting markdown content to various formats
 */

export interface FormattingOptions {
  includeContactInfo?: boolean;
  includeMetadata?: boolean;
  spacing?: 'single' | 'double';
}

/**
 * Convert markdown content to plain text
 */
export const markdownToPlainText = (markdown: string, options: FormattingOptions = {}): string => {
  let text = markdown;
  
  // Remove markdown syntax
  text = text
    // Remove headers (# ## ###)
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Remove code blocks and inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Convert bullet points
    .replace(/^[-*+]\s+/gm, '• ')
    // Remove extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (options.spacing === 'double') {
    text = text.replace(/\n/g, '\n\n');
  }

  return text;
};

/**
 * Convert markdown content to RTF (Rich Text Format)
 */
export const markdownToRTF = (markdown: string, options: FormattingOptions = {}): string => {
  let rtf = '{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}';
  
  // Split into lines and process
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      rtf += '\\par ';
      continue;
    }
    
    // Headers
    if (trimmedLine.startsWith('# ')) {
      const text = trimmedLine.substring(2);
      rtf += `\\f0\\fs28\\b ${escapeRTF(text)}\\b0\\fs24\\par `;
    } else if (trimmedLine.startsWith('## ')) {
      const text = trimmedLine.substring(3);
      rtf += `\\f0\\fs26\\b ${escapeRTF(text)}\\b0\\fs24\\par `;
    } else if (trimmedLine.startsWith('### ')) {
      const text = trimmedLine.substring(4);
      rtf += `\\f0\\fs24\\b ${escapeRTF(text)}\\b0\\par `;
    }
    // Bold company names (**text**)
    else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      const text = trimmedLine.slice(2, -2);
      rtf += `\\b ${escapeRTF(text)}\\b0\\par `;
    }
    // Bullet points
    else if (trimmedLine.startsWith('- ')) {
      const text = trimmedLine.substring(2);
      rtf += `\\f0\\fs24 \\bullet\\tab ${escapeRTF(processBoldText(text))}\\par `;
    }
    // Regular text
    else {
      rtf += `\\f0\\fs24 ${escapeRTF(processBoldText(trimmedLine))}\\par `;
    }
  }
  
  rtf += '}';
  return rtf;
};

/**
 * Convert markdown content to Word-compatible HTML
 */
export const markdownToWordHTML = (markdown: string, options: FormattingOptions = {}): string => {
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Word.Document">
  <meta name="Generator" content="Microsoft Word">
  <style>
    body {
      font-family: 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.15;
      margin: 1in;
    }
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 0.5em;
      text-align: center;
    }
    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
      border-bottom: 1px solid #000;
    }
    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 0.8em;
      margin-bottom: 0.3em;
    }
    .company {
      font-weight: bold;
      font-style: italic;
    }
    .contact-info {
      text-align: center;
      margin-bottom: 1em;
    }
    ul {
      margin: 0;
      padding-left: 0.5in;
    }
    li {
      margin-bottom: 0.2em;
    }
    p {
      margin: 0.3em 0;
    }
  </style>
</head>
<body>`;

  const lines = markdown.split('\n');
  let inList = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      html += '<p></p>';
      continue;
    }
    
    // Headers
    if (trimmedLine.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = trimmedLine.substring(2);
      html += `<h1>${escapeHTML(text)}</h1>`;
    } else if (trimmedLine.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = trimmedLine.substring(3);
      html += `<h2>${escapeHTML(text)}</h2>`;
    } else if (trimmedLine.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = trimmedLine.substring(4);
      html += `<h3>${escapeHTML(text)}</h3>`;
    }
    // Company names (**text**)
    else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = trimmedLine.slice(2, -2);
      html += `<p class="company">${escapeHTML(text)}</p>`;
    }
    // Bullet points
    else if (trimmedLine.startsWith('- ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      const text = trimmedLine.substring(2);
      html += `<li>${escapeHTML(processBoldText(text))}</li>`;
    }
    // Contact info (emails, phones)
    else if (isContactInfo(trimmedLine)) {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p class="contact-info">${escapeHTML(trimmedLine)}</p>`;
    }
    // Regular text
    else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${escapeHTML(processBoldText(trimmedLine))}</p>`;
    }
  }
  
  if (inList) {
    html += '</ul>';
  }
  
  html += `
</body>
</html>`;
  
  return html;
};

/**
 * Enhanced clipboard copy with multiple format support
 */
export const copyToClipboardWithFormat = async (
  content: string, 
  format: 'plain' | 'rtf' | 'html' = 'plain',
  options: FormattingOptions = {}
): Promise<boolean> => {
  try {
    let formattedContent: string;
    
    switch (format) {
      case 'plain':
        formattedContent = markdownToPlainText(content, options);
        break;
      case 'rtf':
        formattedContent = markdownToRTF(content, options);
        break;
      case 'html':
        formattedContent = markdownToWordHTML(content, options);
        break;
      default:
        formattedContent = content;
    }
    
    if (format === 'html') {
      // For HTML, use the Clipboard API with HTML mime type
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([formattedContent], { type: 'text/html' }),
        'text/plain': new Blob([markdownToPlainText(content, options)], { type: 'text/plain' })
      });
      await navigator.clipboard.write([clipboardItem]);
    } else if (format === 'rtf') {
      // For RTF, try to use the Clipboard API with RTF mime type
      try {
        const clipboardItem = new ClipboardItem({
          'application/rtf': new Blob([formattedContent], { type: 'application/rtf' }),
          'text/rtf': new Blob([formattedContent], { type: 'text/rtf' }),
          'text/plain': new Blob([markdownToPlainText(content, options)], { type: 'text/plain' })
        });
        await navigator.clipboard.write([clipboardItem]);
      } catch (error) {
        // Fallback to plain text if RTF not supported
        await navigator.clipboard.writeText(markdownToPlainText(content, options));
      }
    } else {
      // Plain text
      await navigator.clipboard.writeText(formattedContent);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Helper functions
function escapeRTF(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function processBoldText(text: string): string {
  // Convert **text** to bold markup
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function isContactInfo(text: string): boolean {
  // Check if line contains email, phone, or LinkedIn
  return /[@()\-\d]/.test(text) && 
         (text.includes('@') || text.includes('(') || text.includes('linkedin') || /^\d/.test(text));
}