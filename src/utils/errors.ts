/**
 * Thrown when the server cannot serve a request because a required environment
 * variable is missing. Distinct from client errors: maps to HTTP 500, never 400.
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}
