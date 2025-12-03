# Instruções para Aplicar a Migration de Comentários

## Arquivos Criados/Modificados

### 1. Schema do Prisma (`prisma/schema.prisma`)
- ✅ Adicionado modelo `Comentario` com campos:
  - `id`: UUID
  - `memorialId`: String (relação com Memorial)
  - `nome`: String? (opcional)
  - `texto`: String (obrigatório)
  - `criadoEm`: DateTime (automático)

### 2. Repositório (`src/infra/repositories/PrismaComentariosRepository.ts`)
- ✅ Implementado repositório com métodos:
  - `listByMemorialId()` - Lista comentários com paginação
  - `countByMemorialId()` - Conta comentários
  - `create()` - Cria novo comentário

### 3. Interface do Repositório (`src/domain/repositories/IComentariosRepository.ts`)
- ✅ Definidas interfaces e tipos

### 4. Service (`src/services/ComentariosService.ts`)
- ✅ Implementado service com validações:
  - Verifica se memorial existe
  - Lista comentários com paginação
  - Cria novos comentários

### 5. Rotas (`src/routes/memoriais.ts`)
- ✅ Adicionadas rotas:
  - `GET /memoriais/:slug/comentarios?page=1&limit=5` - Lista comentários
  - `POST /memoriais/:slug/comentarios` - Cria comentário (público)

## Próximos Passos

### Opção 1: Usar `prisma db push` (Recomendado para desenvolvimento)
```bash
cd C:\Users\David\memorial-sass-api
npx prisma db push
```

### Opção 2: Criar Migration Manualmente
1. Crie uma nova pasta de migration:
```bash
mkdir prisma\migrations\$(Get-Date -Format "yyyyMMddHHmmss")_add_comentarios
```

2. Crie o arquivo `migration.sql` dentro dessa pasta com:
```sql
-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "memorialId" TEXT NOT NULL,
    "nome" TEXT,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_memorialId_fkey" FOREIGN KEY ("memorialId") REFERENCES "Memorial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

3. Marque a migration como aplicada:
```bash
npx prisma migrate resolve --applied <nome_da_migration>
```

### Opção 3: Reset do Banco (CUIDADO: Apaga todos os dados)
```bash
npx prisma migrate reset
```

## Após Aplicar a Migration

1. **Gerar o Prisma Client:**
```bash
npx prisma generate
```

2. **Reiniciar o servidor da API** para que as mudanças tenham efeito

3. **Testar os endpoints:**
- GET: `http://localhost:4000/memoriais/[slug]/comentarios?page=1&limit=5`
- POST: `http://localhost:4000/memoriais/[slug]/comentarios`

## Notas Importantes

- As rotas de comentários estão **antes** da rota `/:slug` para evitar conflitos
- Os comentários são **públicos** - não requerem autenticação
- A relação com Memorial tem `onDelete: Cascade` - comentários são deletados quando o memorial é deletado
- As datas são retornadas como strings ISO no formato JSON

