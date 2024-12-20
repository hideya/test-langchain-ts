import { readFile } from 'fs/promises';
import { createInterface } from 'readline';
import { HumanMessage } from '@langchain/core/messages';
import { validateConfig } from './utils/config-validator';
import { initChatModel } from './services/llm-service';
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

    // Initialize chat model
    console.log('Initializing chat model...');
    const chatModel = await initChatModel(config.llm);
    console.log('Chat model initialized successfully');

    console.log('\nWelcome to the CLI Chat! Type your message and press Enter.');
    console.log('Type "quit" or "q" to exit.');
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
        console.log('\nProcessing...');
        const response = await chatModel.generate([[new HumanMessage(trimmedInput)]]);

        if (response.generations[0]?.[0]?.text) {
          console.log('\nAI:', response.generations[0][0].text.trim());
        } else {
          console.log('\nAI: Sorry, I could not generate a response.');
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

// Handle process termination - This is removed because rl.on('close') handles this now.
//process.on('SIGINT', () => {
//  console.log('\nChat session ended. Goodbye!');
//  process.exit(0);
//});

main().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});