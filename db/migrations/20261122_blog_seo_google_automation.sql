-- Stermont Arcade: Neon-backed blog, SEO and Google indexing automation.
-- Applied to Neon project restless-shape-79120240 / database stermont.
CREATE TABLE IF NOT EXISTS public.content_topics (
  slug text PRIMARY KEY, title text NOT NULL, angle text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}', facts text[] NOT NULL DEFAULT '{}',
  links text[] NOT NULL DEFAULT '{}', status text NOT NULL DEFAULT 'pending',
  note text, drafted_on date, source_updated_at timestamptz NOT NULL DEFAULT now(),
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.blog_posts (
  slug text PRIMARY KEY, title text NOT NULL, url text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'published', meta_title text, meta_description text,
  canonical_url text, file_sha text, published_at date,
  synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.seo_audits (
  id bigserial PRIMARY KEY, audit_date date NOT NULL DEFAULT CURRENT_DATE,
  source text NOT NULL, issue_count integer NOT NULL DEFAULT 0,
  report_markdown text NOT NULL DEFAULT '', metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.google_index_inspections (
  url text PRIMARY KEY, verdict text NOT NULL DEFAULT 'UNKNOWN',
  coverage_state text NOT NULL DEFAULT 'Unknown', last_crawl timestamptz,
  google_canonical text, inspected_at timestamptz NOT NULL DEFAULT now(),
  raw jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.google_sitemap_submissions (
  id bigserial PRIMARY KEY, sitemap_url text NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  http_status integer NOT NULL, response_text text
);
CREATE INDEX IF NOT EXISTS seo_audits_date_idx ON public.seo_audits (audit_date DESC);
CREATE INDEX IF NOT EXISTS google_index_inspections_state_idx ON public.google_index_inspections (verdict, inspected_at DESC);
CREATE INDEX IF NOT EXISTS content_topics_status_idx ON public.content_topics (status, slug);
ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_index_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sitemap_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.content_topics, public.blog_posts, public.seo_audits, public.google_index_inspections, public.google_sitemap_submissions FROM PUBLIC, anonymous;
