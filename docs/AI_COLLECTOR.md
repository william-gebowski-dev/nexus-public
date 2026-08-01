# Coletor Local de IA (Local 9Router Collector)

## Visão Geral
O coletor local (`scripts/ai-collector.ts`) é um utilitário CLI que roda na mesma máquina do **9Router** (porta 20128). Sua função é coletar estatísticas operacionais e de uso, sanitizar dados sensíveis e enviar via POST autenticado para a API serverless do Nexus.

## Comandos Disponíveis
| Comando                      | Descrição                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run ai:collect`         | Executa uma única coleta local com `ROUTER_BASE_URL` e envia para `NEXUS_INGEST_URL`         |
| `npm run ai:collect:dry`     | Coleta e imprime o payload sanitizado no stdout, **sem enviar** para a Vercel              |
| `npm run ai:collect:watch`   | Executa em loop infinito no intervalo `COLLECTOR_INTERVAL_SECONDS` (padrão 300s)            |

## Variáveis de Ambiente
| Variável                   | Descrição                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `ROUTER_BASE_URL`          | Endereço HTTP do 9Router local (padrão `http://127.0.0.1:20128`)                            |
| `ROUTER_API_TOKEN`         | Token de autenticação do 9Router (opcional)                                                |
| `NEXUS_INGEST_URL`         | URL do endpoint Vercel `/api/ai/ingest`                                                    |
| `NEXUS_INGEST_SECRET`      | Segredo HMAC compartilhado entre o coletor e a Vercel para verificação de assinatura       |
| `COLLECTOR_INTERVAL_SECONDS`| Intervalo entre coletas no modo `--watch` (padrão 300s = 5 minutos)                        |

## Sanitização Local
O coletor aplica regex de sanitização antes de enviar para garantir que:
- IPs (incluindo Tailscale) são bloqueados/redacted.
- Chaves de API (`sk-*`, `sk-ant-*`, `ghp_*`, `nvapi-*`, etc.) são redacted.
- Paths Unix absolutos são bloqueados.
- Hostnames internos (`srvXXXXX`) são redacted.
- E-mails são redacted.

## Instalação como Serviço (systemd)
Use o template em `deploy/nexus-ai-collector.service.example`:
```bash
cp deploy/nexus-ai-collector.service.example /home/william/.config/systemd/user/nexus-ai-collector.service
systemctl --user daemon-reload
systemctl --user enable --now nexus-ai-collector.service
```