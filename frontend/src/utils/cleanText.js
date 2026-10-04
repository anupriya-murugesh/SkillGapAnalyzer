export function cleanHtmlText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  try {
    // 1. Unescape HTML entities (&lt;p&gt; -> <p>)
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawText, "text/html");
    let text = doc.body.textContent || "";

    // 2. Unescape double-encoded text
    if (text.includes("&lt;") || text.includes("&gt;")) {
      const doc2 = parser.parseFromString(text, "text/html");
      text = doc2.body.textContent || "";
    }

    // 3. Strip HTML tags and standalone tag words (br, p, li, div, ul)
    return text
      .replace(/<[^>]*>/g, " ")
      .replace(/\b(br|p|div|li|ul|ol|span|strong|em|h1|h2|h3|a)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (e) {
    return rawText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }
}

export function truncateText(text, maxLength = 180) {
  const cleaned = cleanHtmlText(text);
  if (!cleaned) return "No description available.";
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

export function extractKeySkills(text) {
  if (!text) return ["Software Development"];
  const commonSkills = ["React", "Python", "Node.js", "Java", "C#", ".NET", "AWS", "Docker", "Kubernetes", "SQL", "TypeScript", "JavaScript"];
  const found = commonSkills.filter(skill => 
    new RegExp(`\\b${skill.replace('.', '\\.')}\\b`, 'i').test(text)
  );
  return found.length > 0 ? found : ["Engineering"];
}
