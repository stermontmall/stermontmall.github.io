-- 2026-11-28: log whether each new-order email was sent (used by order-emails.js).
-- STATUS: tested on temporary Neon branch tmp-test-guest-order-20261128 only. NOT applied to production yet: needs owner OK.
-- Apply (production, database stermont), one statement at a time:

CREATE OR REPLACE FUNCTION public.log_order_email(p_ref text, p_phone text, p_recipient_type text, p_recipient_email text, p_success boolean, p_error text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public' AS $fn$
DECLARE o public.orders%rowtype; rt text := lower(coalesce(p_recipient_type,'')); em text := lower(trim(coalesce(p_recipient_email,'')));
BEGIN
  IF rt NOT IN ('customer','admin') OR em = '' OR char_length(em) > 200 THEN RETURN jsonb_build_object('ok',false); END IF;
  -- only for an order that exists, was created in the last 15 minutes, and whose phone matches (blocks spam on other orders)
  SELECT * INTO o FROM public.orders WHERE upper(ref)=upper(trim(coalesce(p_ref,''))) AND created_at > now() - interval '15 minutes'
    AND right(regexp_replace(phone,'\D','','g'),9) = right(regexp_replace(coalesce(p_phone,''),'\D','','g'),9) LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false); END IF;
  INSERT INTO public.order_notifications(order_id,order_ref,status,recipient_type,recipient_email,success,error)
  VALUES (o.id,o.ref,'received',rt,em,coalesce(p_success,false),left(p_error,300))
  ON CONFLICT (order_id,status,lower(recipient_email)) DO UPDATE SET success=excluded.success, error=excluded.error, sent_at=now();
  RETURN jsonb_build_object('ok',true);
END $fn$;

REVOKE ALL ON FUNCTION public.log_order_email(text,text,text,text,boolean,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_order_email(text,text,text,text,boolean,text) TO anonymous;

-- Rollback:
-- DROP FUNCTION public.log_order_email(text,text,text,text,boolean,text);
-- Check after applying: SELECT order_ref, recipient_type, success, error, sent_at FROM public.order_notifications WHERE status='received' ORDER BY sent_at DESC;
