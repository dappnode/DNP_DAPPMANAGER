const argMinLen = 8;
const argMaxLen = 63;

export function validateDockerEnv(value: string, argName: string): string | null {
  if (value.includes("'")) {
    return `${argName} must not include the quotes`;
  }
  if (!/^([\x20-\x7F])*$/.test(value)) {
    return `${argName} must include only simple ASCII characters`;
  }
  if (value.includes("$")) {
    return `${argName} must not include the $ character`;
  }
  return null;
}

export function validateMinLength(value: string, argName: string): string | null {
  if (value.length < argMinLen) {
    return `${argName} must be at least ${argMinLen} characters long`;
  }
  return null;
}

export function validateMaxLength(value: string, argName: string): string | null {
  if (value.length > argMaxLen) {
    return `${argName} must be at less than ${argMaxLen} characters long`;
  }
  return null;
}

export function validateStrongPassword(password: string): string | null {
  if (password.length < argMinLen) {
    return `Password must be at least ${argMinLen} characters long`;
  }
  if (password.length > argMaxLen) {
    return `Password must not exceed ${argMaxLen} characters long`;
  }
  if (!/\d+/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[A-Z]+/.test(password)) {
    return "Password must contain at least one capital letter";
  }
  return null;
}

export function validatePasswordsMatch(password: string, password2: string): string | null {
  if (password2 && password !== password2) {
    return "Passwords do not match";
  }
  return null;
}

export function validateStrongPasswordConfirm(password: string, password2: string): string | null {
  return validateStrongPassword(password) || validatePasswordsMatch(password, password2);
}

export function validateStrongPasswordAsDockerEnv(password: string): string | null {
  return validateDockerEnv(password, "Password") || validateStrongPassword(password);
}
