export const isEmpty = (val: string) => !val || val.trim().length === 0;
export const isWhitespace = (val: string) => val.length > 0 && val.trim().length === 0;

export const validateProject = (data: any) => {
  const errors: Record<string, string> = {};
  if (isEmpty(data.name)) errors.name = 'Project name is required';
  if (data.name && data.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  return errors;
};

export const validateBug = (data: any) => {
  const errors: Record<string, string> = {};
  if (isEmpty(data.module)) errors.module = 'Module is required';
  if (isEmpty(data.summary)) errors.summary = 'Summary is required';
  if (data.summary && data.summary.trim().length < 3)
    errors.summary = 'Summary must be at least 3 characters';
  return errors;
};

export const validatePassword = (password: string) => {
  if (isEmpty(password)) return 'Password cannot be empty';
  if (isWhitespace(password)) return 'Password cannot be only spaces';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};
