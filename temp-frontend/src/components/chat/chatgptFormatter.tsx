interface ChatGPTFormatterProps {
  response: string;
  writing: boolean;
}

const ChatGPTFormatter: React.FC<ChatGPTFormatterProps> = ({
  response,
  writing,
}) => {
  const formatResponse = (text: string): string => {
    if (!text || typeof text !== "string") {
      console.warn("Invalid input text:", text);
      return "";
    }

    // Remove double quotes at start and end if they exist
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }

    try {
      let formattedText = text;

      // Handle code blocks (```)
      formattedText = formattedText.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
      );
      // Handle inline code (`code`)
      formattedText = formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");

      // Headings (###, ##, #)
      formattedText = formattedText.replace(/^###\s+(.*)$/gm, "<h3>$1</h3>");
      formattedText = formattedText.replace(/^##\s+(.*)$/gm, "<h2>$1</h2>");
      formattedText = formattedText.replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");

      // Blockquotes
      formattedText = formattedText.replace(
        /^>\s?(.*)$/gm,
        "<blockquote>$1</blockquote>"
      );

      // Links [text](url)
      formattedText = formattedText.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );

      // Bold (** or __)
      formattedText = formattedText.replace(
        /(\*\*|__)(.*?)\1/g,
        "<strong>$2</strong>"
      );
      // Italic (* or _)
      formattedText = formattedText.replace(/(\*|_)(.*?)\1/g, "<em>$2</em>");
      // Strikethrough (~~)
      formattedText = formattedText.replace(/~~(.*?)~~/g, "<del>$1</del>");

      // Handle unordered lists (- or *)
      // Convert consecutive lines starting with - or * into <ul><li>...</li></ul>
      formattedText = formattedText.replace(
        /(^|\n)((?:\s*[-*]\s+.*(?:\n|$))+)/g,
        (match) => {
          const items = match
            .replace(/\n/g, "\n")
            .split(/\n/)
            .filter((line) => /^\s*[-*]\s+/.test(line))
            .map((line) => `<li>${line.replace(/^\s*[-*]\s+/, "")}</li>`) // Remove - or *
            .join("");
          return `<ul>${items}</ul>`;
        }
      );

      // Handle ordered lists (1. 2. 3.)
      formattedText = formattedText.replace(
        /(^|\n)((?:\s*\d+\.\s+.*(?:\n|$))+)/g,
        (match) => {
          const items = match
            .replace(/\n/g, "\n")
            .split(/\n/)
            .filter((line) => /^\s*\d+\.\s+/.test(line))
            .map((line) => `<li>${line.replace(/^\s*\d+\.\s+/, "")}</li>`) // Remove 1. 2. etc
            .join("");
          return `<ol>${items}</ol>`;
        }
      );

      // Split by double newlines for paragraphs
      formattedText = formattedText
        .split(/\n\n+/)
        .map((paragraph) => {
          // If already a block element, don't wrap in <p>
          if (
            /^\s*<(h[1-6]|ul|ol|li|pre|blockquote|table|p)[\s>]/.test(
              paragraph.trim()
            )
          ) {
            return paragraph;
          }
          return `<p>${paragraph.trim()}</p>`;
        })
        .join("");

      // Convert remaining single newlines to <br/>
      formattedText = formattedText.replace(
        /(?<!<br\/>|<li>|<\/li>|<ul>|<\/ul>|<ol>|<\/ol>|<h[1-6]>|<\/h[1-6]>|<p>|<\/p>|<blockquote>|<\/blockquote>|<pre>|<\/pre>|<code>|<\/code>)\n/g,
        "<br/>"
      );

      return formattedText;
    } catch (error) {
      console.error("Error formatting text:", error);
      return text;
    }
  };

  return (
    <div className={`inline-block relative`}>
      <span
        dangerouslySetInnerHTML={{ __html: formatResponse(response) }}
        className={writing ? "mr-1" : ""}
      />
      {writing && (
        <span className="inline-block relative top-0 right-0 blinking-cursor">
          |
        </span>
      )}
    </div>
  );
};

export default ChatGPTFormatter;
