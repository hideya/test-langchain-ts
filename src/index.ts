import { readFile } from 'fs/promises';
import { createInterface } from 'readline';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
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

    console.log('Chat initialized. Type "quit" or "q" to exit.');
    console.log('─'.repeat(50));

    // Create readline interface
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    // Function to handle chat interaction
    const processMessage = async (input: string): Promise<void> => {
      try {
        const messages = [new HumanMessage(input)];
        console.log('Generating response...');
        const response = await chatModel.generate([messages]);

        if (response.generations[0]?.[0]?.text) {
          console.log('\nAI:', response.generations[0][0].text.trim());
        } else {
          console.log('\nAI: Sorry, I couldn\'t generate a response.');
        }
        console.log('─'.repeat(50));
      } catch (error) {
        console.error('\nError generating response:', (error as Error).message);
        console.log('─'.repeat(50));
      }
    };

    // Chat loop
    const askQuestion = () => {
      rl.question('You: ', async (input) => {
        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'q') {
          console.log('Goodbye!');
          rl.close();
          process.exit(0);
          return;
        }

        await processMessage(input);
        askQuestion();
      });
    };

    // Start the chat loop
    askQuestion();

  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('Configuration Error:', error.message);
    } else {
      console.error('Error:', (error as Error).message);
    }
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGoodbye!');
  process.exit(0);
});

main().catch((error) => {
  console.error('Fatal Error:', error);
  process.exit(1);
});