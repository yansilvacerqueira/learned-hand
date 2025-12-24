#!/bin/bash

# Script de teste rápido para o projeto DocProc
# Uso: ./test_project.sh

set -e

echo "🧪 Testando o projeto DocProc"
echo "================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o backend está rodando
echo "1️⃣  Verificando Backend (http://localhost:8000)..."
if curl -s -f http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Backend está rodando${NC}"
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    echo "   Resposta: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Backend não está respondendo${NC}"
    echo "   Execute: docker-compose up backend"
    exit 1
fi

echo ""

# Verificar se o frontend está rodando
echo "2️⃣  Verificando Frontend (http://localhost:5173)..."
if curl -s -f http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✓ Frontend está rodando${NC}"
else
    echo -e "${YELLOW}⚠ Frontend pode não estar rodando${NC}"
    echo "   Execute: docker-compose up frontend"
fi

echo ""

# Testar listagem de documentos
echo "3️⃣  Testando listagem de documentos..."
DOCUMENTS_RESPONSE=$(curl -s http://localhost:8000/documents)
if [ $? -eq 0 ]; then
    DOC_COUNT=$(echo $DOCUMENTS_RESPONSE | grep -o '"id"' | wc -l)
    echo -e "${GREEN}✓ Endpoint de documentos funcionando${NC}"
    echo "   Documentos encontrados: $DOC_COUNT"
else
    echo -e "${RED}✗ Erro ao listar documentos${NC}"
fi

echo ""

# Testar busca
echo "4️⃣  Testando busca de documentos..."
SEARCH_RESPONSE=$(curl -s "http://localhost:8000/search?q=test")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Endpoint de busca funcionando${NC}"
else
    echo -e "${RED}✗ Erro ao buscar documentos${NC}"
fi

echo ""

# Verificar banco de dados (se Docker estiver rodando)
echo "5️⃣  Verificando Banco de Dados..."
if docker ps | grep -q "docproc-db"; then
    DB_COUNT=$(docker-compose exec -T db psql -U postgres -d docproc -t -c "SELECT COUNT(*) FROM documents;" 2>/dev/null | tr -d ' ' || echo "0")
    if [ ! -z "$DB_COUNT" ] && [ "$DB_COUNT" != "0" ]; then
        echo -e "${GREEN}✓ Banco de dados conectado${NC}"
        echo "   Documentos no banco: $DB_COUNT"
    else
        echo -e "${YELLOW}⚠ Banco de dados conectado, mas sem documentos${NC}"
        echo "   Execute o script de seed: cd scripts && python seed_data.py"
    fi
else
    echo -e "${YELLOW}⚠ Banco de dados não está rodando no Docker${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Testes concluídos!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "   • Acesse o frontend: http://localhost:5173"
echo "   • Acesse a documentação da API: http://localhost:8000/docs"
echo "   • Para popular com dados de teste: cd scripts && python seed_data.py"
echo ""

