-- Clear migration seed rows and user data before importing a production dump.
SET session_replication_role = replica;

TRUNCATE TABLE
  public.mention_clears,
  public.chat_reads,
  public.chat_messages,
  public.match_comments,
  public.predictions,
  public.profiles,
  public.matches,
  public.pool_members,
  public.pools,
  public.app_settings;

ALTER TABLE public.chat_reads DROP CONSTRAINT IF EXISTS chat_reads_pkey;
ALTER TABLE public.mention_clears DROP CONSTRAINT IF EXISTS mention_clears_pkey;
ALTER TABLE public.chat_messages ALTER COLUMN pool_id DROP NOT NULL;
ALTER TABLE public.match_comments ALTER COLUMN pool_id DROP NOT NULL;
ALTER TABLE public.chat_reads ALTER COLUMN pool_id DROP NOT NULL;
ALTER TABLE public.mention_clears ALTER COLUMN pool_id DROP NOT NULL;

RESET session_replication_role;
