-- Avis sur les lectures payantes : note 1-5 + commentaire libre + opt-in publication.
-- La colonne historique `feedback` (good|meh, capturée au 1-clic) reste pour compat.
-- `feedback_public` = consentement explicite à afficher l'avis en preuve sociale.
alter table readings
  add column if not exists rating smallint check (rating between 1 and 5),
  add column if not exists feedback_text text,
  add column if not exists feedback_public boolean not null default false,
  add column if not exists feedback_at timestamptz;

-- Vue lecture seule des avis publiables (consentis + note >= 4), pour la preuve
-- sociale du site. N'expose AUCUNE donnee personnelle (pas d'email, pas de token).
create or replace view v_public_reviews as
select
  r.rating,
  r.feedback_text,
  r.tool_type,
  r.locale,
  coalesce(nullif(split_part(r.inputs_json->>'fullName', ' ', 1), ''), split_part(r.email, '@', 1)) as first_name,
  r.feedback_at
from readings r
where r.feedback_public = true
  and r.rating >= 4
  and r.feedback_text is not null
  and length(btrim(r.feedback_text)) > 0
order by r.feedback_at desc;

grant select on v_public_reviews to anon;
