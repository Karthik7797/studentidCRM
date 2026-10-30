/** Keep internal links in the current workspace and preserve their record context. */
export function workspaceHref(
  scope: 'demo' | 'live',
  view: string,
  context: Record<string, string | undefined> = {},
) {
  const query = new URLSearchParams();
  if (scope === 'live') query.set('workspace', scope);
  for (const [key, value] of Object.entries(context)) {
    if (value && key !== 'workspace' && key !== 'view') query.set(key, value);
  }
  const path = view === 'overview' ? '/' : `/${view}`;
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
