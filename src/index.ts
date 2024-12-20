import { readFile } from 'fs/promises';
import { createInterface } from 'readline';
import { validateConfig } from './utils/config-validator';
import { LLMService } from './services/llm-service';
// import { ConfigurationError } from './types/config';

// ANSI color codes for prettier console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  gray: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

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
    const llmService = await LLMService.initialize(config.llms, config.default_llm, {
      maxMessages: 10,
      systemPrompt: "You are a helpful AI assistant. Respond concisely and clearly.",
    });
    console.log('LLM service initialized successfully');

    console.log(`\n${colors.yellow}Welcome to the CLI Chat! Available commands:`);
    console.log('- Type your message and press Enter to chat');
    console.log('- Type "/switch <model-name>" to switch between available models');
    console.log('- Type "/list" to see available models');
    console.log('- Type "/history" to view chat history');
    console.log('- Type "/clear" to clear the current conversation context');
    console.log(`- Type "quit" or "q" to exit${colors.reset}\n`);

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

            case 'clear':
              llmService.clearCurrentContext();
              console.log('\nConversation context cleared');
              break;

            case 'history':
              const history = llmService.getCurrentContext().getFormattedHistory();
              console.log('\nChat History:');
              history.forEach((msg, i) => {
                if (msg.startsWith('System:')) {
                  console.log(`${i + 1}. ${colors.yellow}${msg}${colors.reset}`);
                } else if (msg.startsWith('AI:')) {
                  console.log(`${i + 1}. ${colors.cyan}${msg}${colors.reset}`);
                } else {
                  console.log(`${i + 1}. ${msg}`);
                }
              });
              break;

            default:
              console.log('\nUnknown command. Available commands: /list, /switch <model-name>, /history, /clear');
          }
        } else {
          // console.log('\nProcessing...');
          const chatModel = llmService.getCurrentModel();
          const context = llmService.getCurrentContext();

          // Add user message to context
          context.addMessage(trimmedInput, 'human');

          // Generate response using the full conversation context
          const response = await chatModel.generate([context.getMessages()]);

          if (response.generations[0]?.[0]?.text) {
            const aiResponse = response.generations[0][0].text.trim();
            console.log(`\n${colors.cyan}AI: ${aiResponse}${colors.reset}`);

            // Add AI response to context
            context.addMessage(aiResponse, 'ai');
          } else {
            console.log('\nAI: Sorry, I could not generate a response.');
          }
        }
      } catch (error) {
        console.error('\nError:', (error as Error).message);
      }

      console.log('\n');
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