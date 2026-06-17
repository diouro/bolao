-- Backfill Friends pool and pool_id after importing a pre-multi-pool dump.
SET session_replication_role = replica;

ALTER TABLE public.chat_reads REPLICA IDENTITY FULL;
ALTER TABLE public.mention_clears REPLICA IDENTITY FULL;

DO $$
DECLARE
  v_pool_id uuid;
  v_owner_id uuid;
  v_invite_code text;
BEGIN
  SELECT id
  INTO v_pool_id
  FROM public.pools
  WHERE slug = 'friends'
  LIMIT 1;

  IF v_pool_id IS NULL THEN
    SELECT id
    INTO v_owner_id
    FROM public.profiles
    WHERE deleted_at IS NULL
    ORDER BY case when role = 'admin' then 0 else 1 end, created_at
    LIMIT 1;

    IF v_owner_id IS NULL THEN
      RETURN;
    END IF;

    v_invite_code := lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    INSERT INTO public.pools (name, slug, invite_code, created_by)
    VALUES ('Friends', 'friends', v_invite_code, v_owner_id)
    RETURNING id INTO v_pool_id;
  END IF;

  INSERT INTO public.pool_members (pool_id, user_id, role, has_paid, joined_at)
  SELECT
    v_pool_id,
    p.id,
    case when p.role = 'admin' then 'owner'::public.pool_role else 'member'::public.pool_role end,
    p.has_paid,
    p.created_at
  FROM public.profiles p
  WHERE p.deleted_at IS NULL
  ON CONFLICT (pool_id, user_id) DO UPDATE
  SET
    has_paid = excluded.has_paid,
    left_at = null;

  UPDATE public.chat_messages SET pool_id = v_pool_id WHERE pool_id IS NULL;
  UPDATE public.match_comments SET pool_id = v_pool_id WHERE pool_id IS NULL;
  UPDATE public.chat_reads SET pool_id = v_pool_id WHERE pool_id IS NULL;
  UPDATE public.mention_clears SET pool_id = v_pool_id WHERE pool_id IS NULL;
END $$;

ALTER TABLE public.chat_messages ALTER COLUMN pool_id SET NOT NULL;
ALTER TABLE public.match_comments ALTER COLUMN pool_id SET NOT NULL;
ALTER TABLE public.chat_reads ALTER COLUMN pool_id SET NOT NULL;
ALTER TABLE public.mention_clears ALTER COLUMN pool_id SET NOT NULL;

ALTER TABLE public.chat_reads
ADD CONSTRAINT chat_reads_pkey PRIMARY KEY (pool_id, user_id);

ALTER TABLE public.mention_clears
ADD CONSTRAINT mention_clears_pkey PRIMARY KEY (pool_id, user_id, source, source_id);

RESET session_replication_role;
