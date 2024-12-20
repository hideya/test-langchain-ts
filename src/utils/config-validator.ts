import { AppConfig, ConfigurationError } from '../types/config';

export function validateConfig(config: any): AppConfig {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Invalid configuration format');
  }

  if (!config.llm) {
    throw new ConfigurationError('Missing llm configuration');
  }

  const { llm } = config;
  
  if (!llm.model || typeof llm.model !== 'string') {
    throw new ConfigurationError('Invalid or missing model');
  }

  if (!llm.provider || typeof llm.provider !== 'string') {
    throw new ConfigurationError('Invalid or missing provider');
  }

  if (typeof llm.temperature !== 'number' || llm.temperature < 0 || llm.temperature > 1) {
    throw new ConfigurationError('Invalid or missing temperature (should be between 0 and 1)');
  }

  if (!llm.api_key || typeof llm.api_key !== 'string') {
    throw new ConfigurationError('Invalid or missing api_key');
  }

  return config as AppConfig;
}
