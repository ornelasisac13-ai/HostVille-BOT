# HostVille-BOT# 🛡️ HostVille-Bot - Sistema Completo de Moderação

**Versão 5.0.1** - Bot de moderação avançado para Discord com sistema de warns ultra completo, monitoramento de mensagens e painel administrativo.

---

## 📋 Sobre o Projeto

O **HostVille-Bot** é um assistente de moderação completo para Discord, desenvolvido em **Node.js** com a biblioteca **discord.js v14**. Ele oferece um sistema robusto de moderação com:

- ✅ Monitoramento automático de mensagens ofensivas
- ⚠️ Sistema de warns ultra completo (com expiração, templates e punições automáticas)
- 🛡️ Painel administrativo com botões interativos
- 👑 Painel exclusivo para o dono do bot
- 📊 Relatórios diários automáticos
- 💾 Backup manual de dados
- 📝 Comandos por DM para staff

---

## 🚀 Funcionalidades Principais

### 🛡️ Moderação Automática
- Detecta e remove automaticamente mensagens com palavras ofensivas
- Sistema de leet speak (ex: "v4i t0m4r n0 cU")
- Staff é isenta de moderação automática
- Logs detalhados no terminal

### ⚠️ Sistema de Warns
- Adicionar warns com motivo e duração personalizada
- Remover warns específicos
- Limpar todos os warns de um usuário
- Verificar histórico de warns
- Estatísticas de warns (global e por servidor)
- Templates de warns pré-definidos
- Punições automáticas por quantidade de warns
- Sistema de blacklist
- Backup manual de dados

### 👑 Painel do Dono
- Acesso exclusivo via comando `Hello` na DM
- Desligamento remoto do bot
- Gerenciamento de monitoramento por servidor
- Visualização de estatísticas globais de warns

### 📊 Relatórios
- Relatórios diários automáticos enviados por DM para staff
- Relatórios manuais via comando `/report`
- Estatísticas de mensagens deletadas, warns, movimentação de membros
- Ranking de comandos mais usados

### 🖥️ Menu Interativo no Console
- Estatísticas detalhadas em tempo real
- Listagem de servidores e membros
- Envio de mensagens para canais
- Status de monitoramento
- Gerar relatórios manualmente
- Criar backups

---

## 📦 Tecnologias Utilizadas

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| Node.js | 16.9.0+ | Ambiente de execução |
| discord.js | 14.14.0+ | Biblioteca para API do Discord |
| dotenv | 16.3.1+ | Gerenciamento de variáveis de ambiente |
| chalk | 4.1.2+ | Terminal colorido |
| node-cron | 3.0.3+ | Agendamento de tarefas |
| axios | 1.6.2+ | Requisições HTTP (backup) |
| fs | nativo | Sistema de arquivos |

---

## ⚙️ Configuração do Ambiente

### 1. Clone o repositório
```bash
git clone https://github.com/ornelasisac13-ai/HostVille-BOT
