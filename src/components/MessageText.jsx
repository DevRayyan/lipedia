// import React, { useState } from 'react';
// import ReactMarkdown from 'react-markdown';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
// import remarkGfm from 'remark-gfm';



// // Custom component to format the message with syntax highlighting
// const FormattedResponse = ({ response }) => {

//   return (
//     <ReactMarkdown
//       children={response}
//       remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown for tables
//       components={{
//         // Handle code blocks with syntax highlighting
//         code({ node, inline, className, children, ...props }) {
//           const match = /language-(\w+)/.exec(className || '');
//           return !inline && match ? (
//             <div className='relative border border-stone-300 rounded-lg my-5 '>
//               <div className='absolute -top-4 left-5 bg-white text-sm rounded-md px-3 py-1 font-inter font-medium  bg-emerald-300'>{match[1]}</div>
//               <SyntaxHighlighter className="rounded-xl " style={githubGist} language={match[1]} children={String(children).replace(/\n$/, '')} />
//               <button
//                 onClick={copyToClipboard}
//                 className="absolute top-0 right-2 bg-emerald-500 text-white rounded-md px-2 py-1 text-xs font-medium"
//                 title="Copy to Clipboard"
//               >
//                 {copied ? 'Copied!' : 'Copy'}
//               </button>
//             </div>
//           ) : (
//             <code className="bg-stone-100 px-2 py-1 rounded-md text-sm" {...props}>{children}</code>
//           );
//         },
//         // Handle links to render them with react-router links or simple anchor tags
//         a({ href, children }) {
//           return (
//             <a to={href} target="_blank" rel="noopener noreferrer">
//               {children}
//             </a>
//           );
//         },
//         // Handle blockquotes, just a wrapper with some styling
//         blockquote({ children }) {
//           return <blockquote style={{ borderLeft: '4px solid #ccc', paddingLeft: '1rem', margin: '1rem 0' }}>{children}</blockquote>;
//         },
//         // Handle images, just a wrapper
//         img({ src, alt }) {
//           return <img src={src} alt={alt} style={{ maxWidth: '100%', height: 'auto' }} />;
//         },
//         // Handle unordered lists
//         ul({ children }) {
//           return <ul style={{ marginLeft: '20px' }}>{children}</ul>;
//         },
//         // Handle ordered lists
//         ol({ children }) {
//           return <ol style={{ marginLeft: '20px' }}>{children}</ol>;
//         },
//         // Handle list items
//         li({ children }) {
//           return <li>{children}</li>;
//         },
//         // Handle tables: styling and displaying table elements
//         table({ children }) {
//           return (
//             <table className="table-auto w-full border-collapse border border-gray-300">
//               {children}
//             </table>
//           );
//         },
//         // Handle table header
//         th({ children }) {
//           return (
//             <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-bold">
//               {children}
//             </th>
//           );
//         },
//         // Handle table body cells
//         td({ children }) {
//           return (
//             <td className="border border-gray-300 px-4 py-2">
//               {children}
//             </td>
//           );
//         },
//         // Handle table rows
//         tr({ children }) {
//           return (
//             <tr className="border-b">{children}</tr>
//           );
//         }
//       }}
//     />
//   );
// };

// // MessageText component that uses FormattedResponse to format and display the message content
// const MessageText = ({ content }) => {


//   return (
//     <div className="message-text">
//       <FormattedResponse response={content} />
//     </div>
//   );
// };

// export default MessageText;



import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { githubGist } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import remarkGfm from 'remark-gfm';

const FormattedResponse = ({ response }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <ReactMarkdown
      children={response}
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');
          return !inline && match ? (
            <div className='relative border border-stone-300 rounded-lg my-5 '>
              <div className='absolute -top-4 left-5 bg-white text-sm rounded-md px-3 py-1 font-inter font-medium bg-emerald-300'>
                {match[1]}
              </div>
              <SyntaxHighlighter
                className="rounded-xl"
                style={githubGist}
                language={match[1]}
                children={codeString}
              />
              <button
                onClick={() => copyToClipboard(codeString)}
                className="absolute top-2 right-2 bg-stone-100 text-black border border-stone-300 rounded-md px-3 py-1 text-xs font-medium"
                title="Copy to Clipboard"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          ) : (
            <code className="bg-stone-100 px-2 py-1 rounded-md text-sm" {...props}>
              {children}
            </code>
          );
        },
        a({ href, children }) {
          return (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return <blockquote style={{ borderLeft: '4px solid #ccc', paddingLeft: '1rem', margin: '1rem 0' }}>{children}</blockquote>;
        },
        img({ src, alt }) {
          return <img src={src} alt={alt} style={{ maxWidth: '100%', height: 'auto' }} />;
        },
        ul({ children }) {
          return <ul style={{ marginLeft: '20px' }}>{children}</ul>;
        },
        ol({ children }) {
          return <ol style={{ marginLeft: '20px' }}>{children}</ol>;
        },
        li({ children }) {
          return <li>{children}</li>;
        },
        table({ children }) {
          return <table className="table-auto w-full border-collapse border border-gray-300">{children}</table>;
        },
        th({ children }) {
          return (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-bold">
              {children}
            </th>
          );
        },
        td({ children }) {
          return <td className="border border-gray-300 px-4 py-2">{children}</td>;
        },
        tr({ children }) {
          return <tr className="border-b">{children}</tr>;
        },
      }}
    />
  );
};

const MessageText = ({ content }) => {
  return (
    <div className="message-text">
      <FormattedResponse response={content} />  
    </div>
  );
};

export default MessageText;
