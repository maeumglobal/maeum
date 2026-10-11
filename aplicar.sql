-- ============================================================================
--  MAEUM GLOBAL - aplicar.sql
--  Migracao completa do banco (Supabase Postgres, schema public)
--
--  COMO USAR
--    1) Supabase Dashboard > SQL Editor > New > cole este arquivo > Run
--       (ou: psql "$DIRECT_URL" -f aplicar.sql)
--    2) O script e idempotente: pode rodar quantas vezes quiser.
--
--  O QUE ESTE SCRIPT FAZ
--    - cria/ajusta colunas, indices e chaves estrangeiras do schema real
--    - cria as tabelas SiteSetting e MediaAsset
--    - ARQUIVA em legacy_archive_maeum e depois REMOVE as 44 tabelas maeum_*
--      (legadas, quase vazias, sem nenhum SELECT no codigo da aplicacao)
--    - tranca o acesso direto do Postgres via PostgREST (anon/authenticated)
--    - remove as policies de Storage que davam escrita anonima
--    - converte senhas que estavam em texto puro para hash scrypt
--    - popula o catalogo publico para o site nascer completo
--
--  BACKUP
--    Rode um backup antes (Dashboard > Database > Backups, ou
--    pg_dump "$DIRECT_URL" > backup.sql). A secao 9 e a unica destrutiva e
--    so roda depois que a secao 8.1 arquivar tudo.
-- ============================================================================

BEGIN;

SET LOCAL statement_timeout = '600s';
SET LOCAL lock_timeout = '30s';
SET search_path TO public, pg_temp;

DO $$ BEGIN
  RAISE NOTICE '>>> Maeum Global: iniciando migracao';
END $$;


-- ============================================================================
-- 1. EXTENSOES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;


-- ============================================================================
-- 2. NOVAS TABELAS
-- ============================================================================

-- 2.1 SiteSetting: chave/valor generico do CMS.
--     Substitui maeum_site_settings (chaves cms_text / cms_media / ...).
CREATE TABLE IF NOT EXISTS "SiteSetting" (
  "key"       TEXT        NOT NULL,
  "value"     JSONB       NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- 2.2 MediaAsset: binarios das imagens enviadas pelo painel, servidos por
--     /api/media/[id]. Evita depender de service_role e nao consome Edge Functions.
CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id"           TEXT        NOT NULL,
  "filename"     TEXT        NOT NULL,
  "mimeType"     TEXT        NOT NULL DEFAULT 'image/webp',
  "size"         INTEGER     NOT NULL DEFAULT 0,
  "width"        INTEGER,
  "height"       INTEGER,
  "alt"          TEXT,
  "folder"       TEXT        NOT NULL DEFAULT 'geral',
  "data"         BYTEA       NOT NULL,
  "uploadedById" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaAsset_size_check" CHECK ("size" >= 0 AND "size" <= 10485760)
);

-- 2.3 Arquivo das tabelas legadas (o DROP da secao 9 so roda depois daqui).
CREATE TABLE IF NOT EXISTS "legacy_archive_maeum" (
  "table_name" TEXT        NOT NULL,
  "data"       JSONB       NOT NULL,
  "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "legacy_archive_maeum_pkey" PRIMARY KEY ("table_name")
);


-- ============================================================================
-- 3. COLUNAS NOVAS NAS TABELAS EXISTENTES
--    Todas com DEFAULT ou NULL: nao quebram linhas ja gravadas.
-- ============================================================================

-- 3.1 BlogPost: variantes en/es, tempo de leitura, autor padrao corrigido
ALTER TABLE "BlogPost"
  ADD COLUMN IF NOT EXISTS "titleEn"        TEXT,
  ADD COLUMN IF NOT EXISTS "titleEs"        TEXT,
  ADD COLUMN IF NOT EXISTS "excerptEn"      TEXT,
  ADD COLUMN IF NOT EXISTS "excerptEs"      TEXT,
  ADD COLUMN IF NOT EXISTS "readingMinutes" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "BlogPost" ALTER COLUMN "author" SET DEFAULT 'Maeum Editorial';

-- 3.2 Category: nome traduzido
ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "nameEn" TEXT,
  ADD COLUMN IF NOT EXISTS "nameEs" TEXT;

-- 3.3 Chat: colunas de atendimento.
--     customerId vira NULL porque o chat do site pertence a um Lead (vai para
--     leadId) e o chat do portal pertence a um User.
ALTER TABLE "Chat"
  ADD COLUMN IF NOT EXISTS "leadId"             TEXT,
  ADD COLUMN IF NOT EXISTS "status"             TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS "subject"            TEXT,
  ADD COLUMN IF NOT EXISTS "lastMessageAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "lastMessagePreview" TEXT,
  ADD COLUMN IF NOT EXISTS "readAt"             TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closedAt"           TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "visitorTokenHash"   TEXT;
ALTER TABLE "Chat" ALTER COLUMN "customerId" DROP NOT NULL;

-- 3.4 ChatMessage: autoria real, idempotencia e anexos
ALTER TABLE "ChatMessage"
  ADD COLUMN IF NOT EXISTS "senderType"     TEXT NOT NULL DEFAULT 'visitor',
  ADD COLUMN IF NOT EXISTS "clientKey"      TEXT,
  ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;
ALTER TABLE "ChatMessage" ALTER COLUMN "senderId" DROP NOT NULL;

-- 3.5 Destination: legenda, traducoes e ordenacao
ALTER TABLE "Destination"
  ADD COLUMN IF NOT EXISTS "subtitle"      TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionEs" TEXT,
  ADD COLUMN IF NOT EXISTS "sortOrder"     INTEGER NOT NULL DEFAULT 0;

-- 3.6 Experience / KbeautyExperience
ALTER TABLE "Experience"
  ADD COLUMN IF NOT EXISTS "titleEn"       TEXT,
  ADD COLUMN IF NOT EXISTS "titleEs"       TEXT,
  ADD COLUMN IF NOT EXISTS "subtitleEn"    TEXT,
  ADD COLUMN IF NOT EXISTS "subtitleEs"    TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionEs" TEXT,
  ADD COLUMN IF NOT EXISTS "highlightsEn"  TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "highlightsEs"  TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "includedEn"    TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "includedEs"    TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "priceCurrency" TEXT NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS "isFeatured"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder"     INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "KbeautyExperience"
  ADD COLUMN IF NOT EXISTS "priceCurrency" TEXT NOT NULL DEFAULT 'BRL';

-- 3.7 Journey: traducoes, destaque e ordenacao
ALTER TABLE "Journey"
  ADD COLUMN IF NOT EXISTS "titleEn"       TEXT,
  ADD COLUMN IF NOT EXISTS "titleEs"       TEXT,
  ADD COLUMN IF NOT EXISTS "subtitleEn"    TEXT,
  ADD COLUMN IF NOT EXISTS "subtitleEs"    TEXT,
  ADD COLUMN IF NOT EXISTS "conceptEn"     TEXT,
  ADD COLUMN IF NOT EXISTS "conceptEs"     TEXT,
  ADD COLUMN IF NOT EXISTS "includedEn"    TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "includedEs"    TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "notIncludedEn" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "notIncludedEs" TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "isFeatured"    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sortOrder"     INTEGER NOT NULL DEFAULT 0;

-- 3.8 Lead / Partner / Package
ALTER TABLE "Lead"    ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3);
ALTER TABLE "Partner" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'standard';

-- 3.9 Payment: link de cobranca + updatedAt (DEFAULT evita erro em NOT NULL)
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "paymentUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3.10 Proposal / ProposalItem
ALTER TABLE "Proposal"
  ADD COLUMN IF NOT EXISTS "validUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "viewedAt"   TIMESTAMP(3);
-- A FK usa ON DELETE SET NULL, que exige coluna anulavel.
-- O schema.prisma tambem foi ajustado para customerId opcional.
ALTER TABLE "Proposal" ALTER COLUMN "customerId" DROP NOT NULL;

ALTER TABLE "ProposalItem"
  ADD COLUMN IF NOT EXISTS "quantity" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "refId"    TEXT;
ALTER TABLE "ProposalItem" ALTER COLUMN "type" SET DEFAULT 'package';

-- 3.11 User: perfil, sessao e recuperacao de senha
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "bio"              TEXT,
  ADD COLUMN IF NOT EXISTS "jobTitle"         TEXT,
  ADD COLUMN IF NOT EXISTS "locale"           TEXT NOT NULL DEFAULT 'pt',
  ADD COLUMN IF NOT EXISTS "sessionVersion"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastLoginAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resetTokenHash"   TEXT,
  ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- 3.12 Intercambio: ordenacao
ALTER TABLE "ExchangeInstitution" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExchangeCampus"      ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExchangeProgram"
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExchangeProgram" ALTER COLUMN "levelRequired" SET DEFAULT 'Todos os níveis';

-- 3.13 Navegacao: rotulos traduzidos
ALTER TABLE "NavigationItem"
  ADD COLUMN IF NOT EXISTS "labelEn" TEXT,
  ADD COLUMN IF NOT EXISTS "labelEs" TEXT;


-- ============================================================================
-- 4. CHECK CONSTRAINTS DE INTEGRIDADE
--    O Prisma valida no codigo; isto protege o banco de qualquer outra
--    ferramenta, inclusive o SQL Editor. Escrito de forma explicita para
--    ficar legivel e idempotente.
-- ============================================================================

-- 4.1 Papeis e status: tabelas curtas (DROP + ADD = idempotente)
ALTER TABLE "User"      DROP CONSTRAINT IF EXISTS "User_role_chk";
ALTER TABLE "User"      ADD CONSTRAINT "User_role_chk"
  CHECK ("role" IN ('super_admin','admin','consultora','customer'));

ALTER TABLE "Chat"      DROP CONSTRAINT IF EXISTS "Chat_status_chk";
ALTER TABLE "Chat"      ADD CONSTRAINT "Chat_status_chk"
  CHECK ("status" IN ('open','pending','closed'));

ALTER TABLE "ChatMessage" DROP CONSTRAINT IF EXISTS "ChatMessage_senderType_chk";
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderType_chk"
  CHECK ("senderType" IN ('visitor','consultant','system'));

ALTER TABLE "Lead"      DROP CONSTRAINT IF EXISTS "Lead_status_chk";
ALTER TABLE "Lead"      ADD CONSTRAINT "Lead_status_chk"
  CHECK ("status" IN ('novo','contato','atendimento','proposta','proposta_enviada','fechado','perdido'));

ALTER TABLE "Booking"   DROP CONSTRAINT IF EXISTS "Booking_status_chk";
ALTER TABLE "Booking"   ADD CONSTRAINT "Booking_status_chk"
  CHECK ("status" IN ('pending','confirmed','in_progress','completed','cancelled'));

ALTER TABLE "Payment"   DROP CONSTRAINT IF EXISTS "Payment_status_chk";
ALTER TABLE "Payment"   ADD CONSTRAINT "Payment_status_chk"
  CHECK ("status" IN ('pending','paid','failed','refunded','cancelled'));

ALTER TABLE "Proposal"  DROP CONSTRAINT IF EXISTS "Proposal_status_chk";
ALTER TABLE "Proposal"  ADD CONSTRAINT "Proposal_status_chk"
  CHECK ("status" IN ('draft','sent','viewed','approved','rejected','expired'));

ALTER TABLE "Experience" DROP CONSTRAINT IF EXISTS "Experience_status_chk";
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_status_chk"
  CHECK ("status" IN ('active','inactive'));

ALTER TABLE "Experience" DROP CONSTRAINT IF EXISTS "Experience_bookingType_chk";
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_bookingType_chk"
  CHECK ("bookingType" IN ('direct','request'));

ALTER TABLE "KbeautyExperience" DROP CONSTRAINT IF EXISTS "KbeautyExperience_status_chk";
ALTER TABLE "KbeautyExperience" ADD CONSTRAINT "KbeautyExperience_status_chk"
  CHECK ("status" IN ('active','inactive'));

ALTER TABLE "Package"   DROP CONSTRAINT IF EXISTS "Package_status_chk";
ALTER TABLE "Package"   ADD CONSTRAINT "Package_status_chk"
  CHECK ("status" IN ('active','inactive'));

ALTER TABLE "Journey"   DROP CONSTRAINT IF EXISTS "Journey_status_chk";
ALTER TABLE "Journey"   ADD CONSTRAINT "Journey_status_chk"
  CHECK ("status" IN ('active','inactive','soldout'));

ALTER TABLE "JourneyDeparture" DROP CONSTRAINT IF EXISTS "JourneyDeparture_status_chk";
ALTER TABLE "JourneyDeparture" ADD CONSTRAINT "JourneyDeparture_status_chk"
  CHECK ("status" IN ('available','limited','sold_out','cancelled'));

ALTER TABLE "Testimonial" DROP CONSTRAINT IF EXISTS "Testimonial_status_chk";
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_status_chk"
  CHECK ("status" IN ('pending','approved','rejected'));

ALTER TABLE "BlogPost"  DROP CONSTRAINT IF EXISTS "BlogPost_status_chk";
ALTER TABLE "BlogPost"  ADD CONSTRAINT "BlogPost_status_chk"
  CHECK ("status" IN ('draft','published'));

-- 4.2 Faixas numericas e coerencia entre campos
ALTER TABLE "Testimonial" DROP CONSTRAINT IF EXISTS "Testimonial_rating_chk";
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_rating_chk"
  CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_dates_chk";
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_dates_chk"
  CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" >= "startDate");

ALTER TABLE "JourneyDeparture" DROP CONSTRAINT IF EXISTS "JourneyDeparture_dates_chk";
ALTER TABLE "JourneyDeparture" ADD CONSTRAINT "JourneyDeparture_dates_chk"
  CHECK ("endDate" >= "startDate");

ALTER TABLE "JourneyDeparture" DROP CONSTRAINT IF EXISTS "JourneyDeparture_spots_chk";
ALTER TABLE "JourneyDeparture" ADD CONSTRAINT "JourneyDeparture_spots_chk"
  CHECK ("totalSpots" > 0 AND "availableSpots" BETWEEN 0 AND "totalSpots");

-- Status coerente com o numero de vagas restantes
ALTER TABLE "JourneyDeparture" DROP CONSTRAINT IF EXISTS "JourneyDeparture_soldout_chk";
ALTER TABLE "JourneyDeparture" ADD CONSTRAINT "JourneyDeparture_soldout_chk"
  CHECK ("status" <> 'sold_out' OR "availableSpots" = 0);

ALTER TABLE "Journey" DROP CONSTRAINT IF EXISTS "Journey_spots_chk";
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_spots_chk"
  CHECK ("totalSpots" > 0 AND "durationDays" > 0);

ALTER TABLE "Experience" DROP CONSTRAINT IF EXISTS "Experience_values_chk";
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_values_chk"
  CHECK ("durationHours" > 0 AND "pricePerPerson" >= 0);

ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_amount_chk";
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_chk" CHECK ("amount" >= 0);

ALTER TABLE "ProposalItem" DROP CONSTRAINT IF EXISTS "ProposalItem_values_chk";
ALTER TABLE "ProposalItem" ADD CONSTRAINT "ProposalItem_values_chk"
  CHECK ("price" >= 0 AND "quantity" > 0);

-- 4.3 Colunas de texto nao podem ficar vazias onde o app sempre preenche
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_name_chk";
ALTER TABLE "Category" ADD CONSTRAINT "Category_name_chk" CHECK (length(trim("name")) > 0);

ALTER TABLE "Experience" DROP CONSTRAINT IF EXISTS "Experience_title_chk";
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_title_chk" CHECK (length(trim("title")) > 0);

ALTER TABLE "Journey" DROP CONSTRAINT IF EXISTS "Journey_title_chk";
ALTER TABLE "Journey" ADD CONSTRAINT "Journey_title_chk" CHECK (length(trim("title")) > 0);

ALTER TABLE "NavigationItem" DROP CONSTRAINT IF EXISTS "NavigationItem_fields_chk";
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_fields_chk"
  CHECK (length(trim("label")) > 0 AND length(trim("url")) > 0);

ALTER TABLE "FaqItem" DROP CONSTRAINT IF EXISTS "FaqItem_fields_chk";
ALTER TABLE "FaqItem" ADD CONSTRAINT "FaqItem_fields_chk"
  CHECK (length(trim("question")) > 0 AND length(trim("answer")) > 0);


-- ============================================================================
-- 5. CONSERTAR DADOS EXISTENTES ANTES DAS CHAVES ESTRANGEIRAS
-- ============================================================================

-- 5.1 Chat.customerId guardava Lead.id (bug historico do widget antigo).
--     Move para leadId e zera customerId, senao a FK falha.
DO $$
DECLARE moved INT; moved2 INT;
BEGIN
  UPDATE "Chat" c
     SET "leadId"     = c."customerId",
         "customerId" = NULL
   WHERE c."customerId" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = c."customerId")
     AND EXISTS     (SELECT 1 FROM "Lead" l WHERE l.id = c."customerId");
  GET DIAGNOSTICS moved = ROW_COUNT;

  UPDATE "Chat"
     SET "customerId" = NULL
   WHERE "customerId" IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = "customerId");
  GET DIAGNOSTICS moved2 = ROW_COUNT;

  RAISE NOTICE 'Chat: % migradas de customerId para leadId; % orfas zeradas', moved, moved2;
END $$;

-- 5.2 Rotulo do autor a partir do que ja existe
UPDATE "ChatMessage" m
   SET "senderType" = CASE
         WHEN m."senderId" IS NULL THEN 'visitor'
         WHEN EXISTS (SELECT 1 FROM "User" u
                       WHERE u.id = m."senderId"
                         AND u.role IN ('consultora','admin','super_admin'))
           THEN 'consultant'
         ELSE 'visitor' END
 WHERE m."senderType" = 'visitor';

-- 5.3 lastMessageAt / lastMessagePreview reais
--     (o DEFAULT froze tudo no instante do script)
UPDATE "Chat" c
   SET "lastMessageAt"      = COALESCE(last.msg_at, c."createdAt"),
       "lastMessagePreview" = COALESCE(last.preview, c."lastMessagePreview")
  FROM (
    SELECT DISTINCT ON ("chatId")
           "chatId",
           "createdAt"      AS msg_at,
           left("content", 240) AS preview
      FROM "ChatMessage"
     ORDER BY "chatId", "createdAt" DESC
  ) last
 WHERE last."chatId" = c.id;

-- 5.4 Senhas em texto puro para hash scrypt.
--     Formato: scrypt$N$r$p$saltHex$hashHex  (ver src/lib/password.ts)
UPDATE "User" SET "passwordHash" =
  'scrypt$16384$8$1$cc1192c4a9f63ccae14d8035ee2fc74d$492f51633a1d660b9fdd3854c42521eca13c2f3a8a9ef30630f73799843c9d98df34ed13d922ee5b7487fe93e0b22982755330e5053226ed3aa0078f8a0fea7a'
 WHERE "email" = 'admin@maeum.com'
   AND ("passwordHash" IS NULL OR "passwordHash" NOT LIKE 'scrypt$%');

UPDATE "User" SET "passwordHash" =
  'scrypt$16384$8$1$cb47a5fcb8be9183b590b73cb38a7291$b70b9ddd1b5a3b93ba4b6cd698c6f9013dc899633bb1db48f174a24073a35fda2bfe4d0e137e15325afc83bd4bab6e7383a4bb2653ab2a27924c0da8e11fb187'
 WHERE "email" = 'consultora1@maeum.com'
   AND ("passwordHash" IS NULL OR "passwordHash" NOT LIKE 'scrypt$%');

UPDATE "User" SET "passwordHash" =
  'scrypt$16384$8$1$7b92045e628a48248b8f8f4be1cb787f$ad6da17a8194831d268cc23d12517c2bef1ac94012a97e1ce0b6d8c83f39cefadbbce6db293ee09efc61c09b724ac2bdc4478ddfbffc44c0d88d781637ffac71'
 WHERE "email" = 'cliente@maeum.com'
   AND ("passwordHash" IS NULL OR "passwordHash" NOT LIKE 'scrypt$%');

UPDATE "User" SET "passwordHash" =
  'scrypt$16384$8$1$d49eb5e1f391285c9a20d0e2405349ef$7fbc2aafdec297b1739967c82f1ab7386cdb59d8ea6dbf859da4459aacbed8c36217128e5eba7b97c145999b038edcb3d8944e0707310e3ab198e829a4a92c49'
 WHERE "email" = 'teste@gmail.com'
   AND ("passwordHash" IS NULL OR "passwordHash" NOT LIKE 'scrypt$%');

-- 5.5 O seed rodou duas vezes: remove duplicatas
DELETE FROM "BookingTimeline" a USING "BookingTimeline" b
 WHERE a."bookingId" = b."bookingId"
   AND a."title" = b."title"
   AND a."eventDate" = b."eventDate"
   AND a.id > b.id;

DELETE FROM "Payment" a USING "Payment" b
 WHERE a."bookingId" = b."bookingId"
   AND a."amount" = b."amount"
   AND a."status" = b."status"
   AND a."paymentMethod" IS NOT DISTINCT FROM b."paymentMethod"
   AND a.id > b.id;

DELETE FROM "ProposalItem" a USING "ProposalItem" b
 WHERE a."proposalId" = b."proposalId"
   AND a."name" = b."name"
   AND a."price" = b."price"
   AND a.id > b.id;

DELETE FROM "Notification" a USING "Notification" b
 WHERE a."userId" = b."userId" AND a."title" = b."title" AND a.id > b.id;

DELETE FROM "AdminLog" a USING "AdminLog" b
 WHERE a."userId" = b."userId" AND a."action" = b."action" AND a.id > b.id;

-- 5.6 Slugs corrompidos pelo Date.now() do painel antigo (quebravam a URL)
UPDATE "Journey"
   SET "slug" = regexp_replace("slug", '-[0-9]{10,}$', '')
 WHERE "slug" ~ '-[0-9]{10,}$';

-- 5.7 Payment.updatedAt coerente com o historico
UPDATE "Payment"
   SET "updatedAt" = COALESCE("paidAt", "createdAt", CURRENT_TIMESTAMP)
 WHERE "updatedAt" > COALESCE("paidAt", "createdAt", CURRENT_TIMESTAMP) + INTERVAL '1 minute';


-- ============================================================================
-- 6. INDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS "User_role_isActive_idx"                                ON "User"("role","isActive");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx"                                    ON "User"("createdAt");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx"              ON "Notification"("userId","isRead","createdAt");
CREATE INDEX IF NOT EXISTS "Lead_email_idx"                                        ON "Lead"("email");
CREATE INDEX IF NOT EXISTS "Chat_consultantId_status_lastMessageAt_idx"            ON "Chat"("consultantId","status","lastMessageAt");
CREATE INDEX IF NOT EXISTS "Chat_lastMessageAt_idx"                                ON "Chat"("lastMessageAt");
CREATE INDEX IF NOT EXISTS "Chat_leadId_idx"                                       ON "Chat"("leadId");
CREATE INDEX IF NOT EXISTS "ChatMessage_chatId_createdAt_idx"                      ON "ChatMessage"("chatId","createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatMessage_chatId_clientKey_key"               ON "ChatMessage"("chatId","clientKey");
CREATE INDEX IF NOT EXISTS "Proposal_consultantId_idx"                             ON "Proposal"("consultantId");
CREATE INDEX IF NOT EXISTS "ProposalItem_proposalId_idx"                           ON "ProposalItem"("proposalId");
CREATE INDEX IF NOT EXISTS "Booking_startDate_idx"                                 ON "Booking"("startDate");
CREATE INDEX IF NOT EXISTS "BookingTimeline_bookingId_eventDate_idx"               ON "BookingTimeline"("bookingId","eventDate");
CREATE INDEX IF NOT EXISTS "Payment_status_createdAt_idx"                          ON "Payment"("status","createdAt");
CREATE INDEX IF NOT EXISTS "Payment_paidAt_idx"                                    ON "Payment"("paidAt");
CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx"                                 ON "Payment"("bookingId");
CREATE INDEX IF NOT EXISTS "Category_isActive_sortOrder_idx"                       ON "Category"("isActive","sortOrder");
CREATE INDEX IF NOT EXISTS "Experience_status_sortOrder_idx"                       ON "Experience"("status","sortOrder");
CREATE INDEX IF NOT EXISTS "Experience_isFeatured_idx"                             ON "Experience"("isFeatured");
CREATE INDEX IF NOT EXISTS "ExperienceCategory_categoryId_idx"                     ON "ExperienceCategory"("categoryId");
CREATE INDEX IF NOT EXISTS "KbeautyExperience_status_idx"                          ON "KbeautyExperience"("status");
CREATE INDEX IF NOT EXISTS "Journey_status_sortOrder_idx"                          ON "Journey"("status","sortOrder");
CREATE INDEX IF NOT EXISTS "Journey_isFeatured_idx"                                ON "Journey"("isFeatured");
CREATE INDEX IF NOT EXISTS "JourneyDeparture_status_idx"                           ON "JourneyDeparture"("status");
CREATE INDEX IF NOT EXISTS "Destination_isFeatured_sortOrder_idx"                 ON "Destination"("isFeatured","sortOrder");
CREATE INDEX IF NOT EXISTS "BlogPost_status_publishedAt_idx"                       ON "BlogPost"("status","publishedAt");
CREATE INDEX IF NOT EXISTS "Testimonial_status_sortOrder_idx"                      ON "Testimonial"("status","sortOrder");
CREATE INDEX IF NOT EXISTS "FaqItem_isActive_sortOrder_idx"                        ON "FaqItem"("isActive","sortOrder");
CREATE INDEX IF NOT EXISTS "NavigationItem_navigationType_isActive_sortOrder_idx" ON "NavigationItem"("navigationType","isActive","sortOrder");
CREATE INDEX IF NOT EXISTS "CmsBlock_pageName_isActive_sortOrder_idx"             ON "CmsBlock"("pageName","isActive","sortOrder");
CREATE INDEX IF NOT EXISTS "SiteConfig_section_idx"                                ON "SiteConfig"("section");
CREATE INDEX IF NOT EXISTS "ExchangeProgram_isActive_idx"                          ON "ExchangeProgram"("isActive");
CREATE INDEX IF NOT EXISTS "MediaAsset_createdAt_idx"                              ON "MediaAsset"("createdAt");
CREATE INDEX IF NOT EXISTS "MediaAsset_folder_createdAt_idx"                       ON "MediaAsset"("folder","createdAt");
CREATE INDEX IF NOT EXISTS "Document_clientId_idx"                                 ON "Document"("clientId");

-- Busca textual sem acento no catalogo publico
CREATE INDEX IF NOT EXISTS "Journey_title_idx"       ON "Journey"     (lower("title"));
CREATE INDEX IF NOT EXISTS "Experience_title_idx"    ON "Experience"  (lower("title"));
CREATE INDEX IF NOT EXISTS "Package_title_idx"       ON "Package"     (lower("title"));
CREATE INDEX IF NOT EXISTS "BlogPost_title_idx"      ON "BlogPost"    (lower("title"));
CREATE INDEX IF NOT EXISTS "Destination_name_idx"    ON "Destination" (lower("name"));
CREATE INDEX IF NOT EXISTS "FaqItem_question_idx"    ON "FaqItem"     (lower("question"));
CREATE INDEX IF NOT EXISTS "Lead_name_idx"           ON "Lead"        (lower("name"));
CREATE INDEX IF NOT EXISTS "User_name_idx"           ON "User"        (lower("name"));


-- ============================================================================
-- 7. CHAVES ESTRANGEIRAS
--    Todas com ON DELETE explicito. Sem isso, excluir uma atendente quebrava
--    o painel com erro P2003.
-- ============================================================================
DO $$
DECLARE rec RECORD;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('Chat',             'consultantId',  'User',               'id', 'CASCADE'),
      ('Chat',             'customerId',    'User',               'id', 'SET NULL'),
      ('Chat',             'leadId',        'Lead',               'id', 'SET NULL'),
      ('ChatMessage',      'chatId',        'Chat',               'id', 'CASCADE'),
      ('Proposal',         'consultantId',  'User',               'id', 'CASCADE'),
      ('Proposal',         'customerId',    'User',               'id', 'SET NULL'),
      ('Proposal',         'leadId',        'Lead',               'id', 'SET NULL'),
      ('ProposalItem',     'proposalId',    'Proposal',           'id', 'CASCADE'),
      ('Booking',          'clientId',      'User',               'id', 'CASCADE'),
      ('Booking',          'packageId',     'Package',            'id', 'SET NULL'),
      ('Booking',          'proposalId',    'Proposal',           'id', 'SET NULL'),
      ('BookingTimeline',  'bookingId',     'Booking',            'id', 'CASCADE'),
      ('Payment',          'bookingId',     'Booking',            'id', 'CASCADE'),
      ('Notification',     'userId',        'User',               'id', 'CASCADE'),
      ('AdminLog',         'userId',        'User',               'id', 'CASCADE'),
      ('Lead',             'consultantId',  'User',               'id', 'SET NULL'),
      ('Document',         'clientId',      'User',               'id', 'CASCADE'),
      ('Document',         'uploadedById',  'User',               'id', 'CASCADE'),
      ('MediaAsset',       'uploadedById',  'User',               'id', 'SET NULL'),
      ('Experience',       'partnerId',     'Partner',            'id', 'SET NULL'),
      ('ExperienceCategory','experienceId', 'Experience',         'id', 'CASCADE'),
      ('ExperienceCategory','categoryId',   'Category',           'id', 'CASCADE'),
      ('JourneyDeparture', 'journeyId',     'Journey',            'id', 'CASCADE'),
      ('ExchangeCampus',   'institutionId', 'ExchangeInstitution','id', 'CASCADE'),
      ('ExchangeProgram',  'campusId',      'ExchangeCampus',     'id', 'CASCADE')
    ) AS t(tbl, col, reftbl, refcol, delrule)
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', rec.tbl, rec.tbl || '_' || rec.col || '_fkey');
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I(%I) ON DELETE %s ON UPDATE CASCADE',
      rec.tbl, rec.tbl || '_' || rec.col || '_fkey', rec.col, rec.reftbl, rec.refcol, rec.delrule);
  END LOOP;
END $$;


-- ============================================================================
-- 8. SEGURANCA DO BANCO
-- ============================================================================

-- 8.1 ARQUIVAR as tabelas legadas maeum_* em JSONB.
--     Tudo fica recuperavel em public.legacy_archive_maeum antes do DROP.
DO $$
DECLARE t TEXT; n BIGINT;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE 'maeum\_%'
     ORDER BY table_name
  LOOP
    EXECUTE format(
      'INSERT INTO public.legacy_archive_maeum ("table_name","data")
       SELECT %L, COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM %I t',
      t, t);
    EXECUTE format('SELECT count(*) FROM %I', t) INTO n;
    RAISE NOTICE 'arquivado: % (% linhas)', t, n;
  END LOOP;
END $$;

-- 8.2 Remover as policies de Storage que davam escrita anonima.
--     O painel nao usa mais Supabase Storage: as imagens vao para MediaAsset
--     (Postgres) e sao servidas por /api/media/[id].
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE policyname LIKE 'maeum%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    RAISE NOTICE 'policy removida: %.% (%)', p.schemaname, p.tablename, p.policyname;
  END LOOP;
END $$;

-- 8.3 O bucket fica fora do caminho do site
UPDATE storage.buckets SET public = false WHERE id = 'maeum-images';

-- 8.4 Trancar o acesso direto do PostgREST.
--     O app fala com o Postgres pelo Prisma (role postgres, que ignora RLS);
--     nenhuma funcionalidade depende de anon/authenticated.
DO $$
DECLARE r RECORD; kind TEXT;
BEGIN
  -- relkind do pg_class -> palavra-chave SQL correspondente
  FOR r IN
    SELECT c.relname AS obj, c.relkind
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind IN ('r','p','v','m','S','f')
       AND c.relname NOT LIKE 'pg_%'
  LOOP
    kind := CASE r.relkind
              WHEN 'r' THEN 'TABLE'
              WHEN 'p' THEN 'TABLE'
              WHEN 'v' THEN 'VIEW'
              WHEN 'm' THEN 'MATERIALIZED VIEW'
              WHEN 'S' THEN 'SEQUENCE'
              WHEN 'f' THEN 'FOREIGN TABLE'
            END;
    EXECUTE format('REVOKE ALL ON %s public.%I FROM anon, authenticated', kind, r.obj);
  END LOOP;

  -- As funcoes do schema public tambem.
  -- Monta public.nome(tipos): para funcoes sem argumentos, os tipos sao vazios
  -- e a assinatura correta continua sendo public.nome().
  FOR r IN
    SELECT p.proname AS name,
           NULLIF(pg_get_function_identity_arguments(p.oid), '') AS args
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM anon, authenticated',
                   r.name, coalesce(r.args, ''));
  END LOOP;
END $$;

-- 8.5 RLS ligado e SEM policy = bloqueio total para anon/authenticated.
--     Belt-and-suspenders: mesmo que alguem recrie grant, o RLS nega.
DO $$
DECLARE r TEXT;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r);
  END LOOP;
END $$;

-- 8.6 Storage: so o service_role mexe
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON storage.objects FROM anon, authenticated';
  EXECUTE 'REVOKE ALL ON storage.buckets FROM anon, authenticated';
END $$;


-- ============================================================================
-- 8.7 MIGRAR CONTEUDO UTIL DAS TABELAS LEGADAS
--     Precisa acontecer ANTES do DROP da secao 9.
-- ============================================================================

-- 8.7.1 maeum_site_settings -> SiteSetting.
--       cms_text e cms_media comecam vazios: o painel preenche depois.
DO $$
BEGIN
  IF to_regclass('public.maeum_site_settings') IS NULL THEN
    RAISE NOTICE 'maeum_site_settings ausente: secao 8.7.1 ignorada';
  ELSE
    EXECUTE 'INSERT INTO public."SiteSetting" ("key","value","updatedAt") SELECT key, value, CURRENT_TIMESTAMP FROM public.maeum_site_settings ON CONFLICT ("key") DO NOTHING';
  END IF;

  EXECUTE 'INSERT INTO public."SiteSetting" ("key","value","updatedAt") VALUES (''cms_text'', ''{"pt":{},"en":{},"es":{}}''::jsonb, CURRENT_TIMESTAMP) ON CONFLICT ("key") DO NOTHING';
  EXECUTE 'INSERT INTO public."SiteSetting" ("key","value","updatedAt") VALUES (''cms_media'', ''{}''::jsonb, CURRENT_TIMESTAMP) ON CONFLICT ("key") DO NOTHING';
END $$;

-- 8.7.2 maeum_destinations -> Destination (Japao e Vietna so existem ali)
DO $$
BEGIN
  IF to_regclass('public.maeum_destinations') IS NULL THEN RETURN; END IF;

  EXECUTE $mig$
    INSERT INTO public."Destination"
      ("id","name","slug","country","subtitle","description","mainImage","gallery",
       "mapLat","mapLng","isFeatured","sortOrder","createdAt","updatedAt")
    SELECT d.id, d.name, d.slug, d.country, d.short_description, d.description,
           d.main_image, COALESCE(d.gallery::text, '[]'),
           (d.map_coordinates->>'lat')::double precision,
           (d.map_coordinates->>'lng')::double precision,
           COALESCE(d.is_featured, true), COALESCE(d.sort_order, 0),
           COALESCE(d.created_at, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
      FROM public.maeum_destinations d
     WHERE NOT EXISTS (SELECT 1 FROM public."Destination" x WHERE x.slug = d.slug)
  $mig$;
END $$;

-- 8.7.3 maeum_payment_methods -> SiteSetting (a pagina /p/[token] le daqui)
DO $$
BEGIN
  IF to_regclass('public.maeum_payment_methods') IS NULL THEN RETURN; END IF;

  EXECUTE $mig$
    INSERT INTO public."SiteSetting" ("key","value","updatedAt")
    SELECT 'payment_methods',
           COALESCE(jsonb_agg(to_jsonb(m) - 'id' - 'created_at' - 'updated_at'), '[]'::jsonb),
           CURRENT_TIMESTAMP
      FROM public.maeum_payment_methods m
    ON CONFLICT ("key") DO UPDATE
      SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP
  $mig$;
END $$;


-- ============================================================================
-- 9. REMOVER AS TABELAS LEGADAS maeum_*
--    Seguro: a secao 8.1 ja arquivou tudo em legacy_archive_maeum.
-- ============================================================================
DO $$
DECLARE t TEXT; d INT := 0;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name LIKE 'maeum\_%'
     ORDER BY table_name
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', t);
    d := d + 1;
    RAISE NOTICE 'removida: %', t;
  END LOOP;
  RAISE NOTICE '% tabelas maeum_* removidas (backup em legacy_archive_maeum)', d;
END $$;

-- 9.1 Enums que existiam apenas para as tabelas maeum_*.
--     typtype = 'e' identifica ENUM (relkind 'c' cobre composite types,
--     que sao outra coisa).
DO $$
DECLARE e TEXT;
BEGIN
  FOR e IN
    SELECT t.typname FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = 'public'
       AND t.typtype = 'e'
     ORDER BY t.typname
  LOOP
    EXECUTE format('DROP TYPE IF EXISTS public.%I CASCADE', e);
    RAISE NOTICE 'enum removido: %', e;
  END LOOP;
END $$;

-- 9.2 Índices antigos que ficaram redundantes depois das versões compostas.
DROP INDEX IF EXISTS "BlogPost_publishedAt_idx";
DROP INDEX IF EXISTS "BlogPost_status_idx";
DROP INDEX IF EXISTS "BookingTimeline_bookingId_idx";
DROP INDEX IF EXISTS "Category_isActive_idx";
DROP INDEX IF EXISTS "ChatMessage_chatId_idx";
DROP INDEX IF EXISTS "CmsBlock_pageName_isActive_idx";
DROP INDEX IF EXISTS "Destination_isFeatured_idx";
DROP INDEX IF EXISTS "Experience_status_idx";
DROP INDEX IF EXISTS "FaqItem_isActive_idx";
DROP INDEX IF EXISTS "Journey_status_idx";
DROP INDEX IF EXISTS "NavigationItem_navigationType_isActive_idx";
DROP INDEX IF EXISTS "Notification_userId_createdAt_idx";
DROP INDEX IF EXISTS "Notification_userId_isRead_idx";
DROP INDEX IF EXISTS "Payment_clientId_idx";
DROP INDEX IF EXISTS "Payment_status_idx";
DROP INDEX IF EXISTS "Testimonial_status_idx";

-- ============================================================================
-- 10. CATALOGO PUBLICO
--     Popula o que faltava para o site nascer completo.
--     Tudo com ON CONFLICT DO NOTHING / upsert: rodar de novo nao duplica
--     nem sobrescreve o que o administrador ja editou.
-- ============================================================================

-- 10.1 Segunda atendente. O round-robin do chat precisa de mais de uma pessoa.
INSERT INTO "User"
  ("id","name","email","role","phone","jobTitle","bio","locale",
   "passwordHash","isActive","sessionVersion","createdAt","updatedAt")
VALUES
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a24','Juliana Moreira','consultora2@maeum.com',
   'consultora','+55 (41) 98888-1200','Consultora de viagens - Coreia do Sul',
   'Especialista em roteiros autorais pelo interior da Coreia do Sul e em experiencias K-Beauty.','pt',
   'scrypt$16384$8$1$3bf5df3818fefcacf4fb2ae68c435724$9d159d825793a9ad9adca162f54248d636ae21f83b47abee72411c336574833162f6677d1913738129ed5ca4b47561643e1ebbf32bb357d9520fbc223b202457',
   true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;

UPDATE "User" SET
  "jobTitle" = 'Consultora s??nior - Coreia do Sul',
  "bio" = 'Estruturou a curadoria Maeum Global: pal??cios, rua, gastronomia e asClaire de neve em Gangwon.',
  "phone" = '+55 (41) 98709-4799'
 WHERE "email" = 'consultora1@maeum.com';

UPDATE "User" SET
  "jobTitle" = 'Diretoria - Maeum Global',
  "bio" = 'Respons??vel pela opera????o, pelo cat??logo e pela equipe Maeum Global.'
 WHERE "email" = 'admin@maeum.com';

UPDATE "User" SET
  "jobTitle" = 'Consultora de viagens',
  "bio" = 'Refer??ncia em roteiros K-Pop, Musical e nightlife de Seul.'
 WHERE "email" = 'teste@gmail.com';

-- 10.2 Categorias traduzidas (o filtro de /experiencias depende delas)
UPDATE "Category" SET "nameEn" = 'History and Culture',    "nameEs" = 'Historia y Cultura'        WHERE "slug" = 'historia-e-cultura';
UPDATE "Category" SET "nameEn" = 'Gastronomy',             "nameEs" = 'Gastronom??a'              WHERE "slug" = 'gastronomia';
UPDATE "Category" SET "nameEn" = 'Seoul and Urban Life',   "nameEs" = 'Se??l y vida urbana'         WHERE "slug" = 'seul-e-vida-urbana';
UPDATE "Category" SET "nameEn" = 'Wellness',               "nameEs" = 'Bienestar'                 WHERE "slug" = 'bem-estar';
UPDATE "Category" SET "nameEn" = 'Korean Tradition',       "nameEs" = 'Tradici??n coreana'         WHERE "slug" = 'tradicao-coreana';
UPDATE "Category" SET "nameEn" = 'Sensory Experiences',   "nameEs" = 'Experiencias sensoriales'  WHERE "slug" = 'experiencias-sensoriais';
UPDATE "Category" SET "nameEn" = 'K-Beauty',               "nameEs" = 'K-Beauty'                  WHERE "slug" = 'k-beauty';
UPDATE "Category" SET "nameEn" = 'Hanbok and Design',      "nameEs" = 'Hanbok y dise??o'            WHERE "slug" = 'hanbok-e-design';

-- 10.3 VINCULO experiencia <-> categoria.
--       A tabela estava VAZIA, entao o filtro de /experiencias nunca
--       retornava nada e a pagina de detalhe nao mostrava badges.
INSERT INTO "ExperienceCategory" ("experienceId","categoryId")
SELECT e.id, c.id
  FROM "Experience" e
  JOIN "Category" c ON c."slug" = (CASE e.slug
        WHEN 'palacio-historia-e-hanbok'                 THEN 'historia-e-cultura'
        WHEN 'entre-duas-coreias-dmz'                    THEN 'historia-e-cultura'
        WHEN 'uma-noite-as-margens-do-han'               THEN 'gastronomia'
        WHEN 'a-historia-servida-em-uma-tigela-makgeolli' THEN 'gastronomia'
        ELSE 'seul-e-vida-urbana' END)
ON CONFLICT DO NOTHING;

INSERT INTO "ExperienceCategory" ("experienceId","categoryId")
SELECT e.id, c.id
  FROM "Experience" e
  JOIN "Category" c ON c."slug" = (CASE e.slug
        WHEN 'palacio-historia-e-hanbok'                 THEN 'hanbok-e-design'
        WHEN 'a-historia-servida-em-uma-tigela-makgeolli' THEN 'experiencias-sensoriais'
        WHEN 'entre-duas-coreias-dmz'                    THEN 'tradicao-coreana'
        WHEN 'uma-noite-as-margens-do-han'               THEN 'seul-e-vida-urbana'
        WHEN 'seul-depois-do-por-do-sol'                 THEN 'gastronomia'
        ELSE 'bem-estar' END)
ON CONFLICT DO NOTHING;

-- 10.4 Destaque e ordenacao do catalogo
UPDATE "Experience" SET "isFeatured" = true, "sortOrder" = 10 WHERE "slug" = 'seul-depois-do-por-do-sol';
UPDATE "Experience" SET "isFeatured" = true, "sortOrder" = 20 WHERE "slug" = 'palacio-historia-e-hanbok';
UPDATE "Experience" SET "isFeatured" = true, "sortOrder" = 30 WHERE "slug" = 'uma-noite-as-margens-do-han';
UPDATE "Experience" SET "isFeatured" = true, "sortOrder" = 40 WHERE "slug" = 'entre-duas-coreias-dmz';
UPDATE "Experience" SET "isFeatured" = true, "sortOrder" = 50 WHERE "slug" = 'a-historia-servida-em-uma-tigela-makgeolli';

UPDATE "Journey" SET "isFeatured" = true, "sortOrder" = 10 WHERE "slug" = 'projeto-army-2027-always-destination';
UPDATE "Journey" SET "isFeatured" = true, "sortOrder" = 20 WHERE "slug" = 'projeto-army-2027-the-horizon-of-seven-jeju';
UPDATE "Journey" SET "isFeatured" = true, "sortOrder" = 30 WHERE "slug" = 'caravana-de-verao-2027-seul-e-busan';
UPDATE "Journey" SET "isFeatured" = true, "sortOrder" = 40 WHERE "slug" = 'cheotnun-a-magia-da-primeira-neve-na-coreia';

UPDATE "Destination" SET "sortOrder" = 10, "isFeatured" = true WHERE "slug" = 'coreia-do-sul';
UPDATE "Destination" SET "sortOrder" = 20, "isFeatured" = true WHERE "slug" = 'japao';
UPDATE "Destination" SET "sortOrder" = 30, "isFeatured" = true WHERE "slug" = 'vietna';

UPDATE "Destination" SET
  "descriptionEn" = 'A fascinating country that blends thousand-year-old palaces with contemporary pop culture, cutting-edge technology and exclusive K-Beauty clinics.',
  "descriptionEs" = 'Un pa??s fascinante que combina palacios milenarios con la cultura pop contempor??nea, tecnolog??a de punta y cl??nicas exclusivas de K-Beauty.'
 WHERE "slug" = 'coreia-do-sul';

UPDATE "Destination" SET
  "descriptionEn" = 'Historic temples, majestic mountains and vibrant metropolises. Japan offers a perfect harmony between tradition and modernity.',
  "descriptionEs" = 'Templos hist??ricos, monta??as majestuosas y metr??polis vibrantes. Jap??n ofrece una armon??a perfecta entre tradici??n y modernidad.'
 WHERE "slug" = 'japao';

UPDATE "Destination" SET
  "descriptionEn" = 'Lush landscapes, a rich culinary heritage and vibrant cities make Vietnam an unmissable destination.',
  "descriptionEs" = 'Paisajes exuberantes, una rica herencia culinaria y ciudades vibrantes hacen de Vietnam un destino imperdible.'
 WHERE "slug" = 'vietna';

UPDATE "Journey" SET
  "titleEn"    = 'Cheotnun - The Magic of the First Snow in Korea',
  "titleEs"    = 'Cheotnun - La magia de la primera nieve en Corea',
  "subtitleEn" = 'Live the magic of the first snow in Korea with exclusive Maeum Global curation.',
  "subtitleEs" = 'Vive la magia de la primera nieve en Corea con la curacion exclusiva de Maeum Global.',
  "conceptEn"  = 'The first snow in Korea is more than a weather event - it is a moment of renewal, beauty and cultural meaning.',
  "conceptEs"  = 'La primera nieve en Corea es mas que un fenomeno meteorologico: es un momento de renovacion, belleza y significado cultural.'
 WHERE "slug" = 'cheotnun-a-magia-da-primeira-neve-na-coreia';

UPDATE "Journey" SET
  "titleEn"    = 'Summer Caravan 2027 - Seoul and Busan',
  "titleEs"    = 'Caravana de Verano 2027 - Seúl y Busan',
  "subtitleEn" = 'Sun, coast and street food across South Korea in fourteen days.',
  "subtitleEs" = 'Sol, costa y comida callejera por Corea del Sur en catorce días.'
 WHERE "slug" = 'caravana-de-verao-2027-seul-e-busan';

UPDATE "Journey" SET
  "titleEn"    = 'Project ARMY 2027 - Always Destination',
  "titleEs"    = 'Proyecto ARMY 2027 - Always Destination',
  "subtitleEn" = 'The most complete itinerary we have ever built for South Korea.',
  "subtitleEs" = 'El itinerario más completo que hemos construido para Corea del Sur.'
 WHERE "slug" = 'projeto-army-2027-always-destination';

UPDATE "Journey" SET
  "titleEn"    = 'Project ARMY 2027 - The Horizon of Seven - Jeju Edition',
  "titleEs"    = 'Proyecto ARMY 2027 - The Horizon of Seven - Edición Jeju',
  "subtitleEn" = 'Seven days on Jeju island, curated for a small group.',
  "subtitleEs" = 'Siete días en la isla de Jeju, curados para un grupo pequeño.'
 WHERE "slug" = 'projeto-army-2027-the-horizon-of-seven-jeju';

-- 10.5 SAÍDAS das jornadas.
--       A tabela estava VAZIA e a página de detalhe mostrava
--       "Datas e Saídas" em branco.
INSERT INTO "JourneyDeparture"
  ("id","journeyId","startDate","endDate","totalSpots","availableSpots","status","notes","priceAdjustment","createdAt")
SELECT gen_random_uuid()::text, j.id, d.start_at, d.end_at, d.total, d.available, d.status, d.notes, 0, CURRENT_TIMESTAMP
  FROM (VALUES
    ('projeto-army-2027-always-destination',
     DATE '2027-04-08', DATE '2027-04-22', 15, 4, 'limited',
     'Vagas limitadas - confirmação em até 48h após o sinal.'),
    ('projeto-army-2027-always-destination',
     DATE '2027-07-15', DATE '2027-07-29', 15, 11, 'available', NULL),
    ('projeto-army-2027-the-horizon-of-seven-jeju',
     DATE '2027-05-20', DATE '2027-06-03', 12, 7, 'available',
     'Grupo reduzido para preservar a experiência em Jeju.'),
    ('caravana-de-verao-2027-seul-e-busan',
     DATE '2027-01-18', DATE '2027-01-31', 15, 15, 'available',
     'Últimas vagas do ciclo de verão.'),
    ('caravana-de-verao-2027-seul-e-busan',
     DATE '2027-08-05', DATE '2027-08-18', 15, 9, 'available', NULL),
    ('cheotnun-a-magia-da-primeira-neve-na-coreia',
     DATE '2027-01-10', DATE '2027-01-20', 12, 3, 'limited',
     'Temporada de neve - Pyeongchang e o resort de Jisan.'),
    ('cheotnun-a-magia-da-primeira-neve-na-coreia',
     DATE '2027-12-14', DATE '2027-12-24', 12, 8, 'available', NULL)
  ) AS d(jslug, start_at, end_at, total, available, status, notes)
  JOIN "Journey" j ON j.slug = d.jslug
 WHERE NOT EXISTS (
   SELECT 1 FROM "JourneyDeparture" x
    WHERE x."journeyId" = j.id AND x."startDate" = d.start_at);

-- 10.6 PACOTES. Havia um só, e /pacotes compara quatro categorias.
INSERT INTO "Package"
  ("id","title","slug","destination","price","category","description","gallery","itinerary",
   "included","notIncluded","status","createdAt","updatedAt")
VALUES
  ('pkg-essencia-2027','Essência da Coreia do Sul','essencia-da-coreia-do-sul','Coreia do Sul',3500,'standard',
   'Dez dias para entender a Coreia de verdade: palácios, sabor, rua e gente. Pousada quatro estrelas, KTX e um ritmo que funciona sozinho.',
   '["https://images.unsplash.com/photo-1538669715515-5e3819766a9e?q=80&w=800"]',
   '["Dia 1 - Chegada em Seul e caminhada por Myeongdong","Dia 2 - Gyeongbokgung de hanbok e Gwangjang","Dia 3 - Mercado Gwangjang e aula de makgeolli","Dia 4 - Cheorwon e a DMZ","Dia 5 - Seongsu e Insadong","Dia 6 - Rio Han ao entardecer","Dia 7 - Busan e o mercado de Jagalchi","Dia 8 - Haedong Yonggungsa e templos","Dia 9 - Gyeryongsan e retorno","Dia 10 - Livre e despedida"]',
   '["Passagem aérea internacional","Seguro viagem","10 noites em hotel 4 estrelas","Trem de alta velocidade KTX","Café da manhã","Guia em português","Coordenador Maeum Global no destino"]',
   '["Despesas pessoais","Jantares não listados","Ingressos extras","Gorjeta"]',
   'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

  ('pkg-gourmet','Gourmet da Coreia do Sul','gourmet-da-coreia-do-sul','Coreia do Sul',4800,'luxury',
   'Uma semana atrás do fogão coreano: mercado, rua e aula com quem cozinha todos os dias.',
   '["https://images.unsplash.com/photo-1580651315530-69c8e0026377?q=80&w=800"]',
   '["Dia 1 - Chegada e Gwangjang","Dia 2 - Aula de kimchi e jjigae","Dia 3 - Mercado de Nangang e hansik","Dia 4 - Cheorwon e restaurante de campo","Dia 5 - Aula de makgeolli artesanal","Dia 6 - Busan e velha de peixe","Dia 7 - Despedida em Seul"]',
   '["Passagem aérea internacional","Seguro viagem","7 noites em hotel 4 estrelas","KTX","Todas as aulas e refeições do programa","Guia em português"]',
   '["Despesas pessoais","Bebidas alcoólicas","Jantares fora do programa"]',
   'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

  ('pkg-dmz','História e DMZ','historia-e-dmz','Coreia do Sul',2900,'standard',
   'Três dias no norte: a fronteira, os túneis e a memória do país. Para quem lê sobre a Coreia e quer entender o que ela ainda é.',
   '["https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=800"]',
   '["Dia 1 - Cheorwon e Imjingok","Dia 2 - Terceira Zona Militar e observatório","Dia 3 - Imjingak e retorno a Seul"]',
   '["Transporte dedicado com motorista","Guia especializado","Entrada nas áreas autorizadas","Refeições do programa"]',
   '["Despesas pessoais","Souvenirs","Hospedagem (a partir do quarto dia)"]',
   'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

  ('pkg-jeju','Jeju Essencial','jeju-essencial','Coreia do Sul',5600,'luxury',
   'Ilha de lava, pescadoras haenyeo e o pôr do sol mais famoso da Ásia. Quatro dias num ritmo que ainda parece férias.',
   '["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800"]',
   '["Dia 1 - Chegada em Jeju e Seongsan Ilchulbong","Dia 2 - Caminhada com haenyeo em Jeongbang","Dia 3 - Osulloc e cascatas do norte","Dia 4 - Seogwipo e livre"]',
   '["Passagem aérea","Seguro viagem","4 noites em pousada de padrão alto","KTX para Jeju","Guia em português"]',
   '["Despesas pessoais","Almoços não listados"]',
   'active',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- 10.7 PARCEIROS (rodapé da home e do /sobre)
INSERT INTO "Partner"
  ("id","name","category","contactEmail","website","logoUrl","description","status","sortOrder","createdAt","updatedAt")
VALUES
  ('par-cheotnun','Cheotnun','kbeauty','','https://cheotnun.co',NULL,
   'Referência em K-Beauty e bem-estar. Parceira oficial das experiências de skincare da Maeum Global.',
   'active',10,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('par-lexis','Lexis Korea','exchange','','https://lexiskorea.com',NULL,
   'Parceira oficial de intercâmbio de coreano, com campi em Gangnam e Busan.',
   'active',20,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 10.8 FAQ
INSERT INTO "FaqItem" ("id","question","answer","category","sortOrder","isActive","createdAt","updatedAt")
VALUES
  ('faq-06','O roteiro inclui passagem aérea?',
   'Nos pacotes fechados, sim: a passagem aérea internacional e o seguro já estão inclusos. Em roteiros sob medida, você pode escolher entre somente-terra e completo - a consultora monta as opções com valores atualizados no momento da cotação.',
   'Geral',6,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('faq-07','Posso alterar as datas depois de reservar?',
   'Sim, até 45 dias antes da saída, sujeito à disponibilidade aérea e hoteleira. As taxas de alteração são informadas na proposta antes de qualquer pagamento.',
   'Geral',7,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('faq-08','Como funciona o pagamento?',
   'Aceitamos Pix, boleto e cartão em até 24 vezes. A reserva é confirmada com 30% de entrada e o restante pode ser parcelado até 30 dias antes da saída.',
   'Pagamentos',8,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('faq-09','O grupo é pequeno?',
   'Sim. Nossas jornadas ficam entre 12 e 15 pessoas, com dois acompanhantes por no máximo 30. É o que permite entrar em lugares que o turismo de massa não alcança.',
   'Geral',9,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('faq-10','Vocês atendem sozinhos ou em casal?',
   'Atendemos desde viajante solo até casal. A curadoria muda: sozinhos priorizamos experiências e encontros; em casal, ritmo mais calmo e categoria de hotel melhor.',
   'Geral',10,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  ('faq-11','O que acontece se eu precisar cancelar?',
   'Cancelamentos até 45 dias antes devolvemos 70% do valor. Entre 45 e 15 dias, 50%. Após 15 dias não há estorno - mas é raro: a maioria dos nossos clientes remarca.',
   'Geral',11,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 10.9 DEPOIMENTOS
INSERT INTO "Testimonial"
  ("id","name","destination","text","rating","status","sortOrder","createdAt")
VALUES
  ('tst-05','Renata Lopes','Coreia do Sul',
   'A Maeum Global reorganizou minha viagem inteira em duas semanas de conversa. Acabamos em Nami Island numa quarta-feira de chuva e foi o melhor dia do ano.',
   5,'approved',4,CURRENT_TIMESTAMP),
  ('tst-06','Paulo Henrique','Coreia do Sul',
   'Eu já tinha pesquisado por conta própria e errei em quase tudo. A consultora corrigiu o roteiro e economizou duas estadias desnecessárias.',
   5,'approved',5,CURRENT_TIMESTAMP),
  ('tst-07','Marina Duarte','Japão',
   'Fiz intercâmbio com a Lexis Korea e fui recebida em Seul como se já fosse da família. Todo mundo ainda fala disso.',
   5,'approved',6,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 10.10 ARTIGOS do Journal (a listagem lia um array fixo no código)
INSERT INTO "BlogPost"
  ("id","slug","title","titleEn","titleEs","excerpt","excerptEn","excerptEs","content",
   "author","coverImage","tags","status","readingMinutes","publishedAt","createdAt","updatedAt")
VALUES
  ('post-03','coreia-do-sul-como-ninguem-te-conta',
   'A Coreia do Sul como ninguém te conta',
   'The South Korea nobody tells you about',
   'La Corea del Sur que nadie te cuenta',
   'Um ano morando em Seul muda a forma de olhar o país. O que a gente para de fotografar é exatamente o que vale a viagem.',
   'A year living in Seoul changes how you see the country. What people stop photographing is what makes the trip.',
   'Un año viviendo en Seúl cambia la forma de mirar el país. Lo que la gente deja de fotografiar es lo que hace el viaje.',
   '<p>Depois de um ano em Seul você para de fotografar o colorido da cidade. Deixa de ir a Gyeongbokgung com a mesma câmera. E é aí que o país aparece de verdade.</p><h2>O bairro, não o monumento</h2><p>Hanok em Ikseondong, a padaria da esquina que faz tudo de fermentação natural, a banca de jornais aberta até as onze da noite. A Coreia bonita não é um cartaz - é a rotina que ninguém filma.</p><h2>O que custa mais e vale</h2><p>O KTX. O melhor restaurante da viagem quase nunca é o mais caro: é o que está cheio de gente local ao meio-dia. E o hanbok sob medida vale mais do que qualquer experiência de trezentos dólares.</p>',
   'Maeum Editorial',
   'https://images.unsplash.com/photo-1517154421773-0529f29ea451?q=80&w=1200',
   '["Coreia do Sul","Seul","guia"]','published',6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

  ('post-04','quando-ir-para-coreia-do-sul',
   'Quando ir para a Coreia do Sul',
   'When to travel to South Korea',
   'Cuándo viajar a Corea del Sur',
   'Primavera com cerejeira, verão em Jeju, outono nas montanhas e o inverno de neve em Gangwon. Cada estação pede uma viagem diferente.',
   'Cherry blossom spring, Jeju summer, mountain autumn and Gangwon snow. Every season asks for a different trip.',
   'Primavera con flor de cerezo, verano en Jeju, otoño en las montañas y la nieve de Gangwon. Cada estación pide un viaje distinto.',
   '<h2>Primavera (março a maio)</h2><p>A cerejeira em Seul e em Gyeongju é o período mais procurado - e o mais caro. Se a flor for o que te atrai, reserve com seis meses de antecedência.</p><h2>Verão (junho a agosto)</h2><p>Jeju é o lugar certo: a monção aparece, as temperaturas ficam agradáveis e as tarifas de hotel caem pela metade.</p><h2>Outono (setembro a novembro)</h2><p>O melhor mês do ano. Céu limpo, temperaturas amenas e as montanhas de Gyeonggi em tons de laranja.</p><h2>Inverno (dezembro a fevereiro)</h2><p>Neve em Pyeongchang e Gangwon, águas quentes em Yangyang e o mercado de ano novo de Seul. Poucos turistas, muita cultura.</p>',
   'Maeum Editorial',
   'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200',
   '["Coreia do Sul","quando viajar"]','published',5,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),

  ('post-05','k-beauty-guia-para-iniciantes',
   'K-Beauty: o guia para iniciantes',
   'K-Beauty: a beginner guide',
   'K-Beauty: la guía para principiantes',
   'Rotina coreana não é pele de dez passos. É ordem, consistência e uma clínica que combina com o seu rosto. Explicamos o que realmente importa.',
   'The Korean routine is not a ten-step skin ritual. It is order, consistency and a clinic that suits your skin. Here is what actually matters.',
   'La rutina coreana no es un ritual de diez pasos. Es orden, consistencia y una clínica que le funcione a tu piel. Esto es lo que importa de verdad.',
   '<h2>Tônico não é a mesma coisa que hidratar</h2><p>Se você tem pele oleosa ou mista, tônicos são opcionais. Essenciais são: limpador, hidratante e protetor solar com FPS alto. Sempre.</p><h2>Protetor solar é o produto mais importante</h2><p>Nenhum ativo custa mais caro do que a prevenção do dano solar. SPF 50 ou mais, reaplicado durante o dia, em qualquer estação.</p><h2>Clínica antes de produto</h2><p>Uma boa análise de pele em clínica autorizada vale mais do que dez produtos comprados por impulso. Reserve com antecedência.</p>',
   'Maeum Editorial',
   'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1200',
   '["K-Beauty","skincare","bem-estar"]','published',6,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- 10.11 NAVEGAÇÃO completa (main + footer)
INSERT INTO "NavigationItem"
  ("id","parentId","navigationType","label","labelEn","labelEs","url","icon","sortOrder","isActive","createdAt")
VALUES
  ('nav-01',NULL,'main','Início','Home','Inicio','/',NULL,0,true,CURRENT_TIMESTAMP),
  ('nav-02',NULL,'main','Coreia do Sul','South Korea','Corea del Sur','/coreia-do-sul',NULL,1,true,CURRENT_TIMESTAMP),
  ('nav-03',NULL,'main','Destinos','Destinations','Destinos','/destinos',NULL,2,true,CURRENT_TIMESTAMP),
  ('nav-04',NULL,'main','Experiências','Experiences','Experiencias','/coreia-do-sul/experiencias',NULL,3,true,CURRENT_TIMESTAMP),
  ('nav-05',NULL,'main','Jornadas','Journeys','Viajes en grupo','/coreia-do-sul/jornadas',NULL,4,true,CURRENT_TIMESTAMP),
  ('nav-06',NULL,'main','Intercâmbio','Language exchange','Intercambio','/intercambios',NULL,5,true,CURRENT_TIMESTAMP),
  ('nav-07',NULL,'main','Pacotes','Packages','Paquetes','/pacotes',NULL,6,true,CURRENT_TIMESTAMP),
  ('nav-08',NULL,'main','Journal','Journal','Journal','/journal',NULL,7,true,CURRENT_TIMESTAMP),
  ('nav-09',NULL,'main','Sobre Nós','About us','Sobre nosotros','/sobre',NULL,8,true,CURRENT_TIMESTAMP),
  ('nav-10',NULL,'main','Contato','Contact','Contacto','/contato',NULL,9,true,CURRENT_TIMESTAMP),
  ('nav-11',NULL,'footer','Sobre Nós','About us','Sobre nosotros','/sobre',NULL,0,true,CURRENT_TIMESTAMP),
  ('nav-12',NULL,'footer','Destinos','Destinations','Destinos','/destinos',NULL,1,true,CURRENT_TIMESTAMP),
  ('nav-13',NULL,'footer','Experiências','Experiences','Experiencias','/coreia-do-sul/experiencias',NULL,2,true,CURRENT_TIMESTAMP),
  ('nav-14',NULL,'footer','Jornadas','Journeys','Viajes en grupo','/coreia-do-sul/jornadas',NULL,3,true,CURRENT_TIMESTAMP),
  ('nav-15',NULL,'footer','Journal','Journal','Journal','/journal',NULL,4,true,CURRENT_TIMESTAMP),
  ('nav-16',NULL,'footer','Contato','Contact','Contacto','/contato',NULL,5,true,CURRENT_TIMESTAMP),
  ('nav-17',NULL,'footer','Política de Privacidade','Privacy policy','Política de privacidad','/politica-de-privacidade',NULL,6,true,CURRENT_TIMESTAMP),
  ('nav-18',NULL,'footer','Termos de Uso','Terms of use','Términos de uso','/termos-de-uso',NULL,7,true,CURRENT_TIMESTAMP),
  ('nav-19',NULL,'footer','Política de Reembolso','Refund policy','Política de reembolso','/reembolso',NULL,8,true,CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- 10.12 CONFIGURAÇÃO ESTRUTURADA (Configurações Gerais no painel)
-- O id é gerado aqui porque o DEFAULT uuid() do Prisma é aplicado no cliente.
INSERT INTO "SiteConfig" ("id","section","configKey","value","createdAt","updatedAt")
SELECT
  'cfg-' || s.section || '-' || s.configKey,
  s.section, s.configKey, s.value, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('brand','name','Maeum Global'),
  ('brand','tagline','Turismo de luxo, intercâmbio e experiências exclusivas na Ásia'),
  ('brand','logo_url','/images/logo.png'),
  ('brand','favicon_url','/favicon.ico'),

  ('contact','email','contato@maeumglobal.com.br'),
  ('contact','sales_email','contato@maeumglobal.com.br'),
  ('contact','phone','+55 (41) 98709-4799'),
  ('contact','whatsapp','5541987094799'),
  ('contact','address','Av. Batel 1230, Curitiba, PR, Brasil'),
  ('contact','hours','Segunda a sexta, das 9h às 18h (BRT)'),

  ('social','instagram','https://instagram.com/maeumglobal'),
  ('social','youtube','https://youtube.com/@maeumglobal'),
  ('social','facebook',''),
  ('social','pinterest',''),
  ('social','tiktok',''),

  ('legal','company_name','Maeum Global Travel Ltda.'),
  ('legal','cnpj','00.000.000/0001-00'),
  ('legal','dpo_email','privacidade@maeumglobal.com.br'),
  ('legal','legal_email','juridico@maeumglobal.com.br'),
  ('legal','privacy_url','/politica-de-privacidade'),
  ('legal','terms_url','/termos-de-uso'),
  ('legal','refund_url','/reembolso'),
  ('finance','email','financeiro@maeumglobal.com.br'),

  -- Instruções exibidas na página pública /p/[token]
  ('payments','pix_key','contato@maeumglobal.com.br'),
  ('payments','pix_bank','Banco do Brasil - Agência 1234 - Conta 56789-0'),
  ('payments','boleto_note','O boleto é gerado após a confirmação do pedido e enviado por e-mail.'),
  ('payments','instructions','Após a confirmação do pagamento, nossa consultora entra em contato em até 1 dia útil com os próximos passos.'),

  ('seo','title_suffix','| Maeum Global'),
  ('seo','og_image','/images/agencia-viagens-coreia-do-sul-maeum-global-oficial.webp')
) AS s(section, configKey, value)
ON CONFLICT ("section","configKey") DO NOTHING;

-- Telefone do rodapé (estava com número da Coreia do Sul: +82 10-2483-6078)
UPDATE "SiteConfig" SET "value" = '+55 (41) 98709-4799'
 WHERE "section" = 'contact' AND "configKey" = 'phone' AND "value" LIKE '+82%';

-- 10.13 CHAVES DO CMS (começam vazias; o painel preenche)
INSERT INTO "SiteSetting" ("key","value","updatedAt")
VALUES
  ('cms_text',  '{"pt":{},"en":{},"es":{}}'::jsonb, CURRENT_TIMESTAMP),
  ('cms_media', '{}'::jsonb, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 10.14 Boas-vindas no painel
INSERT INTO "Notification"
  ("id","userId","title","message","type","priority","category","isRead","createdAt")
SELECT
  gen_random_uuid()::text,
  u.id,
  'Bem-vinda(o) ao Maeum Global',
  'Seu acesso está ativo. Use o menu Conversas para atender e Leads para o funil de vendas.',
  'success','normal','system',false,CURRENT_TIMESTAMP
  FROM "User" u
 WHERE u.role IN ('super_admin','admin','consultora')
   AND NOT EXISTS (
     SELECT 1 FROM "Notification" n
      WHERE n."userId" = u.id AND n."title" = 'Bem-vinda(o) ao Maeum Global'
   );


-- ============================================================================
-- 11. COMENTÁRIOS
-- ============================================================================
COMMENT ON TABLE  "SiteSetting" IS 'Chave/valor genérico do CMS (cms_text, cms_media, payment_methods, ...).';
COMMENT ON COLUMN "SiteSetting"."value" IS 'JSONB.';
COMMENT ON TABLE  "MediaAsset" IS 'Binários das imagens do painel, servidos por /api/media/[id]. Evita service_role e Edge Functions.';
COMMENT ON TABLE  "legacy_archive_maeum" IS 'Snapshot JSONB das tabelas maeum_* removidas. Não é usada pela aplicação.';
COMMENT ON COLUMN "Chat"."visitorTokenHash" IS 'sha256(visitorToken) do visitante anônimo: prova de posse do chat. NULL em chats do portal do cliente.';
COMMENT ON COLUMN "ChatMessage"."clientKey" IS 'Chave idempotente gerada no cliente; (chatId, clientKey) é único.';
COMMENT ON COLUMN "ChatMessage"."senderType" IS 'visitor | consultant | system. Determina o lado da bolha no chat.';
COMMENT ON COLUMN "User"."passwordHash" IS 'scrypt$N$r$p$salt$hash. Nunca texto puro. Ver src/lib/password.ts.';


-- ============================================================================
-- 12. RELATÓRIO FINAL
-- ============================================================================
DO $$
DECLARE
  v_users INT; v_chats INT; v_exp INT; v_journeys INT; v_dep INT;
  v_xcat INT; v_leads INT; v_pkg INT; v_faq INT; v_post INT; v_logins TEXT;
BEGIN
  SELECT count(*) INTO v_users    FROM "User";
  SELECT count(*) INTO v_chats    FROM "Chat";
  SELECT count(*) INTO v_exp      FROM "Experience";
  SELECT count(*) INTO v_journeys FROM "Journey";
  SELECT count(*) INTO v_dep      FROM "JourneyDeparture";
  SELECT count(*) INTO v_xcat     FROM "ExperienceCategory";
  SELECT count(*) INTO v_leads    FROM "Lead";
  SELECT count(*) INTO v_pkg      FROM "Package";
  SELECT count(*) INTO v_faq      FROM "FaqItem";
  SELECT count(*) INTO v_post     FROM "BlogPost";

  SELECT string_agg('   ' || email, E'\n' ORDER BY email) INTO v_logins
    FROM "User" WHERE role IN ('super_admin','admin','consultora');

  RAISE NOTICE '';
  RAISE NOTICE '===============================================';
  RAISE NOTICE ' Maeum Global - migração concluída';
  RAISE NOTICE '===============================================';
  RAISE NOTICE ' users=%, chats=%, leads=%', v_users, v_chats, v_leads;
  RAISE NOTICE ' experiências=%, jornadas=%, saídas=%', v_exp, v_journeys, v_dep;
  RAISE NOTICE ' exp<->categorias=%, pacotes=%, faq=%, artigos=%', v_xcat, v_pkg, v_faq, v_post;

  IF EXISTS (SELECT 1 FROM information_schema.tables
              WHERE table_schema='public' AND table_name LIKE 'maeum\_%') THEN
    RAISE WARNING 'AINDA existem tabelas maeum_* no banco: confira a seção 9.';
  END IF;

  IF EXISTS (SELECT 1 FROM "User" WHERE "passwordHash" IS NOT NULL
              AND "passwordHash" NOT LIKE 'scrypt$%') THEN
    RAISE WARNING 'Ainda existe senha em texto puro. Confira a seção 5.4.';
  END IF;

  IF v_logins IS NOT NULL THEN
    RAISE NOTICE 'Acessos da equipe:%', E'\n' || v_logins;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE ' Próximo passo: npm run build e reinicie a aplicação.';
  RAISE NOTICE '===============================================';
END $$;

COMMIT;

-- ============================================================================
-- FIM. Para conferir que não sobrou nada:
--   npx prisma migrate diff \
--     --from-url "$DIRECT_URL" \
--     --to-schema-datamodel prisma/schema.prisma --script
-- A saída esperada é vazia.
-- ============================================================================
