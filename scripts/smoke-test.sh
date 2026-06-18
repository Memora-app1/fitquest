#!/usr/bin/env bash
# Smoke test das rotas PÚBLICAS em produção.
# Pega regressões tipo: proxy/middleware bloqueando rota pública (401/redirect),
# OG image quebrada, perfil público inacessível a deslogados.
#
# Uso: bash scripts/smoke-test.sh [BASE_URL]
# Ex.:  bash scripts/smoke-test.sh https://fitquest-app1.vercel.app

set -u
BASE="${1:-https://fitquest-app1.vercel.app}"
FAIL=0

# check <descrição> <url> <status_esperado> [content_type_esperado]
check() {
  local desc="$1" url="$2" want_status="$3" want_ct="${4:-}"
  local out code ct
  out=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" "$url")
  code="${out%% *}"
  ct="${out#* }"
  if [ "$code" != "$want_status" ]; then
    echo "❌ $desc → status $code (esperado $want_status)  [$url]"
    FAIL=1
  elif [ -n "$want_ct" ] && [[ "$ct" != *"$want_ct"* ]]; then
    echo "❌ $desc → content-type '$ct' (esperado conter '$want_ct')  [$url]"
    FAIL=1
  else
    echo "✅ $desc → $code ${want_ct:+($ct)}"
  fi
}

echo "Smoke test em: $BASE"
echo "─────────────────────────────────────────"

# Páginas públicas
check "Home"                  "$BASE/"                                  200
check "Planos"                "$BASE/planos"                            200
check "Login"                 "$BASE/login"                             200
check "Signup"                "$BASE/signup"                            200

# OG images (DEVEM ser públicas p/ scrapers sociais)
check "OG score"              "$BASE/api/og"                            200 "image/png"
check "OG guild"              "$BASE/api/og/guild"                      200 "image/png"
check "OG achievement"        "$BASE/api/og/achievement?slug=first_habit" 200 "image/png"

# Perfil público (DEVE ser acessível a deslogados — alvo de conversão)
check "Perfil público (deslogado, sem redirect login)" "$BASE/u/teste" 200

# Rotas protegidas DEVEM redirecionar deslogado (307) — não 200, não 500
check "Dashboard protegido (redirect)" "$BASE/dashboard"               307
check "Guilds protegido (redirect)"    "$BASE/guilds"                  307

echo "─────────────────────────────────────────"
if [ "$FAIL" -eq 0 ]; then
  echo "✅ TODOS OS SMOKE TESTS PASSARAM"
else
  echo "❌ ALGUM SMOKE TEST FALHOU — revisar acima"
fi
exit $FAIL
