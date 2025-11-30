// Template rendering helpers

export function renderTemplate(content, variables = [], values = {}) {
  if (!content) return '';
  let rendered = content;

  variables.forEach((variable) => {
    const name = variable.name || variable.key;
    const fallback = variable.default !== undefined ? variable.default : variable.default_value;
    const value = values[name] !== undefined ? values[name] : fallback || '';
    const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(name)}\\s*\\}\\}`, 'g');
    rendered = rendered.replace(regex, String(value));
  });

  return rendered;
}

function escapeRegExp(str = '') {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
