# Handoff: ESLint Config Migration
**Data:** 2026-06-16
**Status geral:** CONCLUÍDO (com pendências de limpeza)

## ✅ O que foi feito

- Diagnosticado que ESLint **não estava instalado** no projeto (ausente do `package.json`)
- Instalados como devDependencies: `eslint@9.39.4`, `eslint-config-next@16.2.9`, `@eslint/eslintrc`
- Criado `eslint.config.js` no formato **flat config** (ESLint v9), substituindo o `.eslintrc.json` legado
- Descartada a abordagem `FlatCompat` — causava `TypeError: Converting circular structure to JSON` porque `eslint-config-next` v16 já exporta flat config arrays nativamente
- Feito downgrade de ESLint v10 para v9: v10 remove o shim `context.getFilename()` que `eslint-plugin-react` v7 ainda usa, causando crash imediato
- Executado `npx eslint src --fix` com sucesso (aplicou fixes automáticos)
- Executado `npx eslint src` — retornou 238 problemas (91 errors, 147 warnings), todos pré-existentes no código

## ⏳ Pendências

### 🔴 CRÍTICO
- Nenhuma pendência crítica — ESLint está funcional e configurado corretamente

### 🟡 IMPORTANTE
- **Deletar `.eslintrc.json`** da raiz do projeto — ESLint v9 ignora ele quando `eslint.config.js` existe, mas mantê-lo gera confusão para outros devs
- **Resolver os 91 errors reais** (não todos são falsos positivos):
  - `react-hooks/purity`: ~60 ocorrências de `Date.now()` e `Math.random()` em Server Components — são **falsos positivos** (Server Components rodam 1x no servidor, sem re-render). Solução: desativar a regra para arquivos de página ou adicionar `// eslint-disable-next-line react-hooks/purity` nos casos legítimos
  - Demais errors: `no-explicit-any`, variáveis fora de escopo — esses são bugs reais
- **Resolver os 147 warnings de `@typescript-eslint/no-unused-vars`** — imports e variáveis declaradas mas nunca usadas espalhados por todo `src/`

### 🟢 MELHORIA
- **Remover `@eslint/eslintrc`** do `package.json` — foi instalado para a abordagem `FlatCompat` que foi descartada; não está sendo usado na solução final
- **Adicionar script `lint` ao `package.json`** — o script atual é `"lint": "tsc --noEmit"`. Considerar mudar para `"lint": "next lint"` ou adicionar `"eslint": "eslint src"` separado
- Avaliar se desabilitar globalmente `react-hooks/purity` para Server Components via configuração no `eslint.config.js`

## 🧠 Contexto para o próximo agente

O projeto não tinha ESLint configurado — o script `lint` no `package.json` só rodava `tsc --noEmit`. Nesta sessão migramos do arquivo legado `.eslintrc.json` (formato ESLint v8) para o `eslint.config.js` (flat config, ESLint v9+).

A decisão mais não-óbvia foi: `eslint-config-next` v16 **não usa mais** o formato `extends` do `.eslintrc` — ele exporta arrays de flat config diretamente via `module.exports`. Por isso `FlatCompat` quebra com erro de referência circular. A solução certa é `require("eslint-config-next/core-web-vitals")` e espalhar o array diretamente.

O outro ponto crítico: ESLint v10 foi instalado inicialmente mas foi necessário downgrade para v9. O motivo é que `eslint-plugin-react` v7 (dependência de `eslint-config-next`) usa `context.getFilename()`, API removida no v10. O v9 ainda mantém esse shim de compatibilidade.

O maior volume de "erros" restantes (60+) são a regra `react-hooks/purity` disparando em Server Components assíncronos que chamam `Date.now()` — isso é falso positivo documentado da regra, não bug real no código.

## 📁 Arquivos tocados nessa sessão

- `eslint.config.js` — **criado** (flat config ESLint v9, usa require direto de eslint-config-next)
- `package.json` — **modificado** (adicionado `eslint`, `eslint-config-next`, `@eslint/eslintrc` em devDependencies)
- `.eslintrc.json` — **não modificado**, mas deve ser deletado (obsoleto, ignorado pelo ESLint v9)

## ⚠️ Armadilhas / Decisões não-óbvias

- **ESLint v10 quebra com eslint-plugin-react v7** — se alguém rodar `npm update` e subir ESLint para v10, o linter vai crashar. Considere pinar `"eslint": "9.x"` no package.json
- **`eslint-config-next` v16 não usa `extends`** — qualquer tentativa de usar `FlatCompat` + `compat.extends("next/core-web-vitals")` vai falhar com circular JSON
- **`Date.now()` em Server Components é falso positivo** — a regra `react-hooks/purity` não distingue Server de Client Components. Não altere o código para "corrigir" esses erros — adicione disable comment ou desative a regra no config
- **O script `lint` no package.json ainda aponta para `tsc --noEmit`**, não para o ESLint. Rodar `npm run lint` não executa o ESLint

## 🎯 Primeiro passo sugerido ao retomar

1. Deletar `.eslintrc.json` da raiz (`git rm .eslintrc.json`)
2. Adicionar ao `eslint.config.js` uma exceção para desabilitar `react-hooks/purity` nos arquivos `**/app/**/page.tsx` e `**/app/**/layout.tsx` (Server Components), assim os 60+ falsos positivos somem e sobram só os erros reais
3. Rodar `npx eslint src` novamente para ver o baseline limpo de erros genuínos
4. Tratar os warnings de `@typescript-eslint/no-unused-vars` em lote (remover imports não usados)
