# Roblox Portfolio

Portfólio Roblox com funções serverless para Cloudflare Pages. O repositório
mantém o frontend em `artifacts/roblox-portfolio` e os quatro endpoints em
`functions/api/`, prontos para publicação a partir da raiz deste repositório.

## Cloudflare Pages conectado ao GitHub

Use estas configurações no projeto do Pages:

- **Root directory:** `/` (raiz do repositório)
- **Build command:** `PORT=8787 BASE_PATH=/ pnpm --filter @workspace/roblox-portfolio run build`
- **Build output directory:** `artifacts/roblox-portfolio/dist/public`
- **Compatibility date:** `2026-11-11`

O arquivo `wrangler.toml` registra a pasta de saída. O `_routes.json` dentro
dela encaminha `/api/*` às funções serverless. Os arquivos em `functions/api/`
encaminham as chamadas para as funções mantidas junto ao app.

O projeto usa pnpm e o `pnpm-lock.yaml` da raiz. Não são necessários tokens,
cookies ou credenciais privadas para consultar os dados públicos do Roblox.

## Endpoints

- `GET /api/presence`
- `GET /api/profiles`
- `GET /api/communities`
- `GET /api/products`
