import { readFile } from 'fs/promises';
import { createInterface } from 'readline';
import { HumanMessage } from '@langchain/core/messages';
import { validateConfig } from './utils/config-validator';
import { LLMService } from './services/llm-service';
import { ConfigurationError } from './types/config';

async function main() {
  try {
    // Check for configuration file argument
    if (process.argv.length < 3) {
      console.error('Please provide a configuration file path');
      process.exit(1);
    }

    const configPath = process.argv[2];

    // Read and parse configuration
    let configFile = await readFile(configPath, 'utf-8');

    // Replace environment variables in the config
    Object.entries(process.env).forEach(([key, value]) => {
      configFile = configFile.replace(`\${${key}}`, value || '');
    });

    const config = validateConfig(JSON.parse(configFile));

    // Initialize LLM service
    console.log('Initializing LLM service...');
    const llmService = await LLMService.initialize(config.llms, config.default_llm);
    console.log('LLM service initialized successfully');

    console.log('\nWelcome to the CLI Chat! Available commands:');
    console.log('- Type your message and press Enter to chat');
    console.log('- Type "/switch <model-name>" to switch between available models');
    console.log('- Type "/list" to see available models');
    console.log('- Type "quit" or "q" to exit');
    console.log('─'.repeat(50));

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.setPrompt('You: ');
    rl.prompt();

    rl.on('line', async (input) => {
      const trimmedInput = input.trim();

      if (trimmedInput.toLowerCase() === 'quit' || trimmedInput.toLowerCase() === 'q') {
        console.log('\nGoodbye!');
        rl.close();
        return;
      }

      if (!trimmedInput) {
        rl.prompt();
        return;
      }

      try {
        if (trimmedInput.startsWith('/')) {
          const [command, ...args] = trimmedInput.slice(1).split(' ');

          switch (command.toLowerCase()) {
            case 'list':
              const models = llmService.listAvailableModels();
              console.log('\nAvailable models:');
              models.forEach(model => console.log(`- ${model}`));
              break;

            case 'switch':
              if (args.length === 0) {
                console.log('\nPlease specify a model name');
                break;
              }
              llmService.switchModel(args[0]);
              console.log(`\nSwitched to model: ${args[0]}`);
              break;

            default:
              console.log('\nUnknown command. Available commands: /list, /switch <model-name>');
          }
        } else {
          console.log('\nProcessing...');
          const chatModel = llmService.getCurrentModel();
          const response = await chatModel.generate([[new HumanMessage(trimmedInput)]]);

          if (response.generations[0]?.[0]?.text) {
            console.log('\nAI:', response.generations[0][0].text.trim());
          } else {
            console.log('\nAI: Sorry, I could not generate a response.');
          }
        }
      } catch (error) {
        console.error('\nError:', (error as Error).message);
      }

      console.log('\n' + '─'.repeat(50));
      rl.prompt();
    });

    rl.on('close', () => {
      console.log('\nChat session ended. Goodbye!');
      process.exit(0);
    });

  } catch (error) {
    console.error('Error:', (error as Error).message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});