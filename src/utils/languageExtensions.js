import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { php } from '@codemirror/lang-php';
import { LanguageSupport } from '@codemirror/language';

export function getLanguageExtension(language) {
  switch (language) {
    case 'javascript':
      return new LanguageSupport(javascript());
    case 'python':
      return new LanguageSupport(python());
    case 'java':
      return new LanguageSupport(java());
    case 'cpp':
      return new LanguageSupport(cpp());
    case 'csharp':
      return new LanguageSupport(cpp()); // Using C++ extension for C# temporarily
    case 'php':
      return new LanguageSupport(php());
    case 'ruby':
      return new LanguageSupport(javascript()); // Using JavaScript extension for Ruby temporarily
    case 'go':
      return new LanguageSupport(javascript()); // Using JavaScript extension for Go temporarily
    case 'rust':
      return new LanguageSupport(javascript()); // Using JavaScript extension for Rust temporarily
    case 'swift':
      return new LanguageSupport(javascript()); // Using JavaScript extension for Swift temporarily
    default:
      return new LanguageSupport(javascript());
  }
} 