import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import chalk from 'chalk';

const TOKEN = process.env.TOKEN || 'SEU_TOKEN_AQUI';

if (!TOKEN || TOKEN === 'SEU_TOKEN_AQUI') {
  console.error(chalk.red('⚠️ TOKEN do bot não definido!'));
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(chalk.green('✅ Bot ligado!'));
  console.log(chalk.white('🔎 Checando comandos cadastrados...'));

  try {
    // Pega todos os comandos globais
    const commands = await client.application.commands.fetch();

    if (!commands.size) {
      console.log(chalk.yellow('Nenhum comando cadastrado.'));
      return;
    }

    console.log(chalk.blue(`Comandos encontrados (${commands.size}):`));
    commands.forEach(cmd => {
      console.log(chalk.cyan(`- /${cmd.name} (ID: ${cmd.id})`));
    });

    // Deletando cada comando
    for (const cmd of commands.values()) {
      await client.application.commands.delete(cmd.id);
      console.log(chalk.red(`❌ Comando deletado: /${cmd.name}`));
    }

    console.log(chalk.green('✅ Todos os comandos foram removidos!'));
  } catch (err) {
    console.error(chalk.red('Erro ao buscar ou deletar comandos:'), err);
  } finally {
    process.exit(0); // fecha o bot após limpar
  }
});

client.login(TOKEN);
