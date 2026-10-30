/** Keep internal links in the current workspace and preserve their record context. */
export function workspaceHref(
  scope: 'demo' | 'live',
  view: string,
  context: Record<string, string | undefined> = {},
) {
  const department = ['sales', 'operations', 'hr'].includes(view);
  const query = new URLSearchParams(department ? {} : {view});
  query.set('workspace', scope);
  for (const [key, value] of Object.entries(context)) {
    if (value && key !== 'workspace' && key !== 'view') query.set(key, value);
  }
  return `${department ? '/' + view : '/'}?${query}`;
}
