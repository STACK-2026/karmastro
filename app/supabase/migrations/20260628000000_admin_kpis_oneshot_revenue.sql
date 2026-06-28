-- Ajoute le revenu PONCTUEL (one-shot : Âme Sœur + packs de crédits) aux KPI admin.
-- Source de vérité = montants réels Stripe (amount_total des checkout.session.completed
-- en mode 'payment' et payés). Le MRR ne couvre que les abonnements, donc ces ventes
-- ponctuelles n'apparaissaient nulle part (dashboard à 0€ malgré l'argent encaissé).
CREATE OR REPLACE FUNCTION public.admin_get_kpis(p_period_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  DECLARE
    v_since TIMESTAMPTZ;
    v_result JSONB;
  BEGIN
    IF NOT public.is_current_user_admin() THEN
      RAISE EXCEPTION 'Access denied: admin role required';
    END IF;

    v_since := now() - (p_period_days || ' days')::interval;

    SELECT jsonb_build_object(
      'total_users', (SELECT COUNT(*) FROM public.profiles),
      'new_users_period', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= v_since),
      'paid_users', (SELECT COUNT(*) FROM public.profiles WHERE subscription_tier IN ('etoile', 'cosmos') AND subscription_status = 'active'),
      'tier_breakdown', (
        SELECT jsonb_object_agg(subscription_tier, cnt)
        FROM (SELECT subscription_tier, COUNT(*) AS cnt FROM public.profiles GROUP BY subscription_tier) t
      ),
      'total_conversations', (SELECT COUNT(*) FROM public.oracle_conversations),
      'conversations_period', (SELECT COUNT(*) FROM public.oracle_conversations WHERE created_at >= v_since),
      'total_messages', (SELECT COUNT(*) FROM public.oracle_messages),
      'messages_period', (SELECT COUNT(*) FROM public.oracle_messages WHERE created_at >= v_since),
      'total_feedbacks', (SELECT COUNT(*) FROM public.oracle_feedback),
      'avg_rating', (SELECT COALESCE(AVG(rating)::numeric(4,2), 0) FROM public.oracle_feedback),
      'total_referrals', (SELECT COUNT(*) FROM public.profiles WHERE referred_by_user_id IS NOT NULL),
      'total_credits_purchased', (SELECT COALESCE(SUM(amount), 0) FROM public.credit_transactions WHERE type = 'purchase'),
      'total_credits_consumed', (SELECT COALESCE(SUM(ABS(amount)), 0) FROM public.credit_transactions WHERE type = 'consume'),
      'stripe_events_period', (SELECT COUNT(*) FROM public.stripe_events WHERE created_at >= v_since),
      'emails_sent_period', (SELECT COUNT(*) FROM public.email_log WHERE created_at >= v_since AND status = 'sent'),
      'emails_failed_period', (SELECT COUNT(*) FROM public.email_log WHERE created_at >= v_since AND status = 'failed'),
      'oneshot_revenue_total', (SELECT COALESCE(SUM((payload->>'amount_total')::numeric)/100.0, 0)::numeric(10,2) FROM public.stripe_events WHERE type='checkout.session.completed' AND payload->>'mode'='payment' AND payload->>'payment_status'='paid'),
      'oneshot_revenue_period', (SELECT COALESCE(SUM((payload->>'amount_total')::numeric)/100.0, 0)::numeric(10,2) FROM public.stripe_events WHERE type='checkout.session.completed' AND payload->>'mode'='payment' AND payload->>'payment_status'='paid' AND created_at >= v_since),
      'oneshot_sales_period', (SELECT COUNT(*) FROM public.stripe_events WHERE type='checkout.session.completed' AND payload->>'mode'='payment' AND payload->>'payment_status'='paid' AND created_at >= v_since)
    ) INTO v_result;

    RETURN v_result;
  END;
  $function$;
