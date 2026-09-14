/**
 * Filter messages based on direction, text content, and invert option
 * @param {Array} messages - Array of message objects
 * @param {Object} filters - Filter configuration
 * @param {string} filters.direction - 'all', 'outgoing', or 'incoming'
 * @param {string} filters.text - Comma-separated terms or a /pattern/flags regex
 * @param {boolean} filters.invert - Whether to exclude messages matching any term
 * @returns {Array} Filtered messages
 */
export const filterMessages = (messages, filters) => {
  const { direction = "all", text = "", invert = false } = filters;
  const regex = parseRegexFromFilter(text);
  const terms = regex ? [] : text.split(/[,，、]/).map((term) => term.trim().toLowerCase()).filter(Boolean);

  return (
    messages
      .filter((msg) => {
        // Direction filter
        if (direction !== "all" && msg.direction !== direction) {
          return false;
        }

        // Text content filter
        if (regex || terms.length > 0) {
          let matchesText;

          if (regex) {
            // Global and sticky regexes retain state between calls to test().
            regex.lastIndex = 0;
            matchesText = regex.test(msg.data);
          } else {
            const messageContent = msg.data.toLowerCase();
            matchesText = terms.some((term) => messageContent.includes(term));
          }

          return invert ? !matchesText : matchesText;
        }

        return true;
      })
      // Remove duplicates using Set for O(n) performance
      .filter((msg, index, arr) => {
        if (index === 0) {
          arr._seenKeys = new Set();
        }
        const key = `${msg.timestamp}|${msg.data}|${msg.direction}`;
        if (arr._seenKeys.has(key)) {
          return false;
        }
        arr._seenKeys.add(key);
        return true;
      })
      // Sort by timestamp (newest first)
      .sort((a, b) => b.timestamp - a.timestamp)
  );
};

/**
 * Filter connections based on URL and invert option
 * @param {Array} connections - Array of connection objects
 * @param {Object} filters - Filter configuration
 * @param {string} filters.text - Text to filter by
 * @param {boolean} filters.invert - Whether to invert the filter
 * @returns {Array} Filtered connections
 */
export const filterConnections = (connections, filters) => {
  const { text = "", invert = false } = filters;

  if (!text.trim()) {
    return connections;
  }

  const regex = parseRegexFromFilter(text);
  const matchesRegex = (value) => {
    regex.lastIndex = 0;
    return regex.test(value);
  };

  return connections.filter((conn) => {
    if (regex) {
      const matches = matchesRegex(conn.url) || matchesRegex(conn.id);
      return invert ? !matches : matches;
    }

    const filterText = text.toLowerCase();
    const urlMatches = conn.url.toLowerCase().includes(filterText);
    const idMatches = conn.id.toLowerCase().includes(filterText);
    const matches = urlMatches || idMatches;

    return invert ? !matches : matches;
  });
};

/**
 * Try to parse a regex from a filter string using the form /pattern/flags.
 * If parsing fails or the string isn't in regex form, returns null.
 * If no flags are provided, defaults to case-insensitive ("i") to preserve previous behavior.
 * @param {string} text
 * @returns {RegExp|null}
 */
const parseRegexFromFilter = (text) => {
  if (!text || !text.startsWith("/")) return null;
  const lastSlash = text.lastIndexOf("/");
  if (lastSlash === 0) return null; // no pattern

  const pattern = text.slice(1, lastSlash);
  let flags = text.slice(lastSlash + 1);

  // Default to case-insensitive if the user did not provide any flags
  if (!flags) flags = "i";

  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    // Invalid regex — fall back to substring matching
    return null;
  }
};
