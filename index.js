import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import chalk from 'chalk';

const TOKEN = process.env.TOKEN || 'SEU_TOKEN_AQUI';
const GUILD_ID = '928614664840052757'; // substitua pelo ID do seu servidor

if (!TOKEN || TOKEN === 'SEU_TOKEN_AQUI') {
  console.error(chalk.red('⚠️ TOKEN do bot não definido!'));
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
  console.log(chalk.green('✅ Bot ligado!'));
  console.log(chalk.white(`🔎 Checando comandos do servidor (${GUILD_ID})...`));

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const commands = await guild.commands.fetch();

    if (!commands.size) {
      console.log(chalk.yellow('Nenhum comando cadastrado neste servidor.'));
      return;
    }

    console.log(chalk.blue(`Comandos encontrados (${commands.size}):`));
    commands.forEach(cmd => {
      console.log(chalk.cyan(`- /${cmd.name} (ID: ${cmd.id})`));
    });

    // Deletando cada comando
    for (const cmd of commands.values()) {
      await guild.commands.delete(cmd.id);
      console.log(chalk.red(`❌ Comando deletado: /${cmd.name}`));
    }

    console.log(chalk.green('✅ Todos os comandos do servidor foram removidos!'));
  } catch (err) {
    console.error(chalk.red('Erro ao buscar ou deletar comandos:'), err);
  } finally {
    process.exit(0);
  }
});

client.login(TOKEN);
