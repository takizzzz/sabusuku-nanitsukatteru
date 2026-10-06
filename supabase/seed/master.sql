-- サービスマスタの初期データ（価格は仮の値。管理画面の「サービスマスタ」で確認・修正する）
-- アフィリエイトURLは入れていない。案件が決まったら管理画面で設定する

insert into categories (slug, name, sort_order) values
  ('ai', '生成AI', 1),
  ('video', '動画', 2),
  ('music', '音楽', 3),
  ('work', '仕事ツール', 4),
  ('learning', '学習', 5),
  ('other', 'その他', 6)
on conflict (slug) do nothing;

insert into services (slug, name, company, category_id, brand_color, official_url) values
  ('chatgpt', 'ChatGPT', 'OpenAI', (select id from categories where slug = 'ai'), '#10a37f', 'https://chatgpt.com/'),
  ('claude', 'Claude', 'Anthropic', (select id from categories where slug = 'ai'), '#d97757', 'https://claude.ai/'),
  ('gemini', 'Google AI Pro', 'Google', (select id from categories where slug = 'ai'), '#4285f4', 'https://gemini.google.com/'),
  ('perplexity', 'Perplexity', 'Perplexity AI', (select id from categories where slug = 'ai'), '#20808d', 'https://www.perplexity.ai/'),
  ('cursor', 'Cursor', 'Anysphere', (select id from categories where slug = 'ai'), '#111111', 'https://cursor.com/'),
  ('github-copilot', 'GitHub Copilot', 'GitHub', (select id from categories where slug = 'ai'), '#24292f', 'https://github.com/features/copilot'),
  ('midjourney', 'Midjourney', 'Midjourney', (select id from categories where slug = 'ai'), '#000000', 'https://www.midjourney.com/'),
  ('v0', 'v0', 'Vercel', (select id from categories where slug = 'ai'), '#000000', 'https://v0.app/'),
  ('elevenlabs', 'ElevenLabs', 'ElevenLabs', (select id from categories where slug = 'ai'), '#000000', 'https://elevenlabs.io/'),
  ('notion', 'Notion', 'Notion Labs', (select id from categories where slug = 'work'), '#000000', 'https://www.notion.com/'),
  ('figma', 'Figma', 'Figma', (select id from categories where slug = 'work'), '#a259ff', 'https://www.figma.com/'),
  ('canva', 'Canva', 'Canva', (select id from categories where slug = 'work'), '#00c4cc', 'https://www.canva.com/'),
  ('adobe-cc', 'Adobe Creative Cloud', 'Adobe', (select id from categories where slug = 'work'), '#da1f26', 'https://www.adobe.com/creativecloud.html'),
  ('deepl', 'DeepL', 'DeepL', (select id from categories where slug = 'work'), '#0f2b46', 'https://www.deepl.com/'),
  ('linear', 'Linear', 'Linear', (select id from categories where slug = 'work'), '#5e6ad2', 'https://linear.app/'),
  ('dropbox', 'Dropbox', 'Dropbox', (select id from categories where slug = 'work'), '#0061fe', 'https://www.dropbox.com/'),
  ('netflix', 'Netflix', 'Netflix', (select id from categories where slug = 'video'), '#e50914', 'https://www.netflix.com/'),
  ('youtube-premium', 'YouTube Premium', 'Google', (select id from categories where slug = 'video'), '#ff0000', 'https://www.youtube.com/premium'),
  ('amazon-prime', 'Amazon プライム', 'Amazon', (select id from categories where slug = 'video'), '#00a8e1', 'https://www.amazon.co.jp/prime'),
  ('disney-plus', 'Disney+', 'Disney', (select id from categories where slug = 'video'), '#113ccf', 'https://www.disneyplus.com/'),
  ('u-next', 'U-NEXT', 'U-NEXT', (select id from categories where slug = 'video'), '#000000', 'https://video.unext.jp/'),
  ('spotify', 'Spotify', 'Spotify', (select id from categories where slug = 'music'), '#1db954', 'https://www.spotify.com/'),
  ('apple-music', 'Apple Music', 'Apple', (select id from categories where slug = 'music'), '#fa243c', 'https://www.apple.com/apple-music/'),
  ('kindle-unlimited', 'Kindle Unlimited', 'Amazon', (select id from categories where slug = 'learning'), '#ff9900', 'https://www.amazon.co.jp/kindle-dbs/hz/subscribe/ku'),
  ('duolingo', 'Duolingo', 'Duolingo', (select id from categories where slug = 'learning'), '#58cc02', 'https://www.duolingo.com/'),
  ('udemy', 'Udemy', 'Udemy', (select id from categories where slug = 'learning'), '#a435f0', 'https://www.udemy.com/'),
  ('google-one', 'Google One', 'Google', (select id from categories where slug = 'other'), '#4285f4', 'https://one.google.com/'),
  ('icloud', 'iCloud+', 'Apple', (select id from categories where slug = 'other'), '#3693f3', 'https://www.apple.com/icloud/')
on conflict (slug) do nothing;

insert into plans (service_id, name, price, billing_cycle, price_checked_at, sort_order)
select s.id, v.name, v.price, v.cycle::billing_cycle, v.checked::date, v.ord from (values
  ('chatgpt', 'Plus', 3000, 'monthly', '2026-10-01', 0),
  ('chatgpt', 'Pro', 30000, 'monthly', '2026-10-01', 1),
  ('claude', 'Pro', 3000, 'monthly', '2026-10-01', 0),
  ('claude', 'Max', 15000, 'monthly', '2026-10-01', 1),
  ('gemini', 'AI Pro', 2900, 'monthly', '2026-10-01', 0),
  ('perplexity', 'Pro', 3000, 'monthly', '2026-10-01', 0),
  ('cursor', 'Pro', 3000, 'monthly', '2026-10-01', 0),
  ('cursor', 'Business', 6000, 'monthly', '2026-10-01', 1),
  ('github-copilot', 'Pro', 1500, 'monthly', '2026-10-01', 0),
  ('github-copilot', 'Pro (年払い)', 15000, 'yearly', '2026-10-01', 1),
  ('midjourney', 'Basic', 1500, 'monthly', '2026-10-01', 0),
  ('midjourney', 'Standard', 4500, 'monthly', '2026-10-01', 1),
  ('v0', 'Premium', 3000, 'monthly', '2026-10-01', 0),
  ('elevenlabs', 'Creator', 3300, 'monthly', '2026-10-01', 0),
  ('notion', 'Plus', 1650, 'monthly', '2026-10-01', 0),
  ('notion', 'Business (AI込み)', 3800, 'monthly', '2026-10-01', 1),
  ('figma', 'Professional', 2400, 'monthly', '2026-10-01', 0),
  ('canva', 'Pro', 1180, 'monthly', '2026-10-01', 0),
  ('adobe-cc', 'コンプリート', 7780, 'monthly', '2026-10-01', 0),
  ('adobe-cc', 'フォト', 2380, 'monthly', '2026-10-01', 1),
  ('deepl', 'Starter', 1200, 'monthly', '2026-10-01', 0),
  ('linear', 'Basic', 1500, 'monthly', '2026-10-01', 0),
  ('dropbox', 'Plus', 1500, 'monthly', '2026-10-01', 0),
  ('netflix', 'スタンダード', 1590, 'monthly', '2026-10-01', 0),
  ('netflix', 'プレミアム', 2290, 'monthly', '2026-10-01', 1),
  ('youtube-premium', '個人', 1280, 'monthly', '2026-10-01', 0),
  ('amazon-prime', '月額', 600, 'monthly', '2026-10-01', 0),
  ('disney-plus', 'スタンダード', 1140, 'monthly', '2026-10-01', 0),
  ('u-next', '月額', 2189, 'monthly', '2026-10-01', 0),
  ('spotify', 'Premium Standard', 1080, 'monthly', '2026-10-01', 0),
  ('apple-music', '個人', 1080, 'monthly', '2026-10-01', 0),
  ('kindle-unlimited', '月額', 980, 'monthly', '2026-10-01', 0),
  ('duolingo', 'Super', 1500, 'monthly', '2026-10-01', 0),
  ('udemy', 'Personal Plan', 2500, 'monthly', '2026-10-01', 0),
  ('google-one', '100GB', 250, 'monthly', '2026-10-01', 0),
  ('icloud', '200GB', 450, 'monthly', '2026-10-01', 0)
) as v(slug, name, price, cycle, checked, ord)
join services s on s.slug = v.slug
where not exists (select 1 from plans p where p.service_id = s.id and p.name = v.name);

