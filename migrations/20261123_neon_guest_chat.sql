-- Neon guest live-chat support
-- Customers authenticate a conversation with a random 256-bit browser token.
-- Only a SHA-256 digest is stored; direct anonymous table access is never granted.

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash bytea NOT NULL UNIQUE,
  customer_name text NOT NULL CHECK (char_length(customer_name) BETWEEN 2 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  email text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','waiting','closed')),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('customer','staff')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx ON public.chat_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS chat_conversations_status_last_message_idx ON public.chat_conversations(status, last_message_at DESC);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS chat_conversations_admin_all ON public.chat_conversations;
CREATE POLICY chat_conversations_admin_all ON public.chat_conversations FOR ALL TO authenticated
  USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
DROP POLICY IF EXISTS chat_messages_admin_all ON public.chat_messages;
CREATE POLICY chat_messages_admin_all ON public.chat_messages FOR ALL TO authenticated
  USING (public.is_store_admin()) WITH CHECK (public.is_store_admin());
GRANT SELECT, UPDATE ON public.chat_conversations TO authenticated;
GRANT SELECT, INSERT ON public.chat_messages TO authenticated;

CREATE OR REPLACE FUNCTION public.chat_start(p_token text, p_name text, p_phone text, p_email text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_hash bytea; v_id uuid;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-fA-F]{64}$' THEN RETURN jsonb_build_object('ok',false,'reason','invalid_token'); END IF;
  IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 100 THEN RETURN jsonb_build_object('ok',false,'reason','invalid_name'); END IF;
  IF p_phone IS NULL OR char_length(btrim(p_phone)) NOT BETWEEN 7 AND 20 THEN RETURN jsonb_build_object('ok',false,'reason','invalid_phone'); END IF;
  v_hash := public.digest(decode(p_token,'hex'),'sha256');
  SELECT id INTO v_id FROM public.chat_conversations WHERE token_hash=v_hash;
  IF v_id IS NULL THEN
    INSERT INTO public.chat_conversations(token_hash,customer_name,phone,email)
    VALUES(v_hash,btrim(p_name),btrim(p_phone),NULLIF(lower(btrim(p_email)),''))
    RETURNING id INTO v_id;
  END IF;
  RETURN jsonb_build_object('ok',true,'conversation_id',v_id);
END $$;

CREATE OR REPLACE FUNCTION public.chat_send(p_token text, p_body text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE v_id uuid; v_message uuid;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-fA-F]{64}$' THEN RETURN jsonb_build_object('ok',false,'reason','invalid_token'); END IF;
  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 2 AND 2000 THEN RETURN jsonb_build_object('ok',false,'reason','invalid_message'); END IF;
  SELECT id INTO v_id FROM public.chat_conversations
    WHERE token_hash=public.digest(decode(p_token,'hex'),'sha256') AND status <> 'closed';
  IF v_id IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','conversation_not_found'); END IF;
  INSERT INTO public.chat_messages(conversation_id,sender,body) VALUES(v_id,'customer',btrim(p_body)) RETURNING id INTO v_message;
  UPDATE public.chat_conversations SET status='waiting',last_message_at=now(),updated_at=now() WHERE id=v_id;
  RETURN jsonb_build_object('ok',true,'message_id',v_message);
END $$;

CREATE OR REPLACE FUNCTION public.chat_history(p_token text)
RETURNS TABLE(id uuid, sender text, body text, created_at timestamptz)
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT m.id,m.sender,m.body,m.created_at
  FROM public.chat_messages m
  JOIN public.chat_conversations c ON c.id=m.conversation_id
  WHERE p_token ~ '^[0-9a-fA-F]{64}$'
    AND c.token_hash=public.digest(decode(p_token,'hex'),'sha256')
  ORDER BY m.created_at ASC LIMIT 200
$$;

REVOKE ALL ON FUNCTION public.chat_start(text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_send(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chat_history(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_start(text,text,text,text) TO anonymous, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_send(text,text) TO anonymous, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_history(text) TO anonymous, authenticated;
