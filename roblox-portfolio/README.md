# Roblox Portfolio

Portfólio de perfis, comunidades e itens públicos do Roblox. A interface não
armazena credenciais; os dados são consultados no servidor e exibidos somente
quando a API pública retorna informações reais.

## Publicar no Cloudflare Pages pelo GitHub

Para publicar o repositório completo pelo GitHub, use as configurações do
`README.md` na raiz do repositório. O Cloudflare Pages encontra as funções nos
arquivos `functions/api/`, que encaminham para a implementação deste artefato.

Se configurar este diretório como raiz do projeto Pages, use:

- **Diretório raiz:** `artifacts/roblox-portfolio`
- **Comando de build:** `pnpm --filter @workspace/roblox-portfolio run build`
- **Diretório de saída:** `dist/public`

O Pages detecta as funções em `functions/api/`. O arquivo
`public/_routes.json` encaminha apenas `/api/*` para essas funções. A
configuração `wrangler.toml` registra o mesmo diretório de saída.

## Endpoints

- `GET /api/presence` — atualiza a presença a cada 20 segundos no cache do
  servidor; a interface consulta a cada 30 segundos.
- `GET /api/profiles` — perfis e miniaturas públicas, cache de uma hora.
- `GET /api/communities` — informações e ícones públicos, cache de uma hora.
- `GET /api/products` — itens públicos das duas comunidades, cache de 15
  minutos.

Na prévia do Replit, os mesmos contratos são servidos pelo serviço de API do
workspace. As funções Cloudflare permanecem separadas para a publicação no
Pages.
