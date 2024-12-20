import { AppConfig, ConfigurationError } from '../types/config';

function validateLLMConfig(llm: any, configName: string): void {
  if (!llm.model || typeof llm.model !== 'string') {
    throw new ConfigurationError(`Invalid or missing model for LLM config: ${configName}`);
  }

  if (!llm.provider || typeof llm.provider !== 'string') {
    throw new ConfigurationError(`Invalid or missing provider for LLM config: ${configName}`);
  }

  if (typeof llm.temperature !== 'number' || llm.temperature < 0 || llm.temperature > 1) {
    throw new ConfigurationError(`Invalid or missing temperature (should be between 0 and 1) for LLM config: ${configName}`);
  }

  if (!llm.api_key || typeof llm.api_key !== 'string') {
    throw new ConfigurationError(`Invalid or missing api_key for LLM config: ${configName}`);
  }
}

export function validateConfig(config: any): AppConfig {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Invalid configuration format');
  }

  if (!config.llms || typeof config.llms !== 'object') {
    throw new ConfigurationError('Missing llms configuration');
  }

  if (Object.keys(config.llms).length === 0) {
    throw new ConfigurationError('At least one LLM configuration must be provided');
  }

  if (!config.default_llm || typeof config.default_llm !== 'string') {
    throw new ConfigurationError('Missing or invalid default_llm configuration');
  }

  if (!config.llms[config.default_llm]) {
    throw new ConfigurationError(`Default LLM "${config.default_llm}" not found in configurations`);
  }

  // Validate each LLM configuration
  for (const [name, llm] of Object.entries(config.llms)) {
    validateLLMConfig(llm, name);
  }

  return config as AppConfig;
}