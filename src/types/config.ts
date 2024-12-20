export interface LLMConfig {
  model: string;
  provider: string;
  temperature: number;
  api_key: string;
}

export interface AppConfig {
  llm: LLMConfig;
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}
