"""supabase/seed/catalog.json から本番に流す SQL を作る（何度流しても同じ結果になる）。

使い方: python3 -I scripts/catalog/to_sql.py > supabase/seed/catalog.sql
- カテゴリとサービスは slug で追加・更新する。
- 料金を確認できたサービスだけ、プランを入れ替える（名前と請求周期が同じものは価格を更新）。
  契約に使われている古いプランは消さずに残す。
- 料金を確認できなかったサービスは、既存のプランに触らない。ただし最初に入れた仮の料金は消す。
"""
import json
import os

here = os.path.dirname(__file__)
data = json.load(open(os.path.join(here, "../../supabase/seed/catalog.json"), encoding="utf-8"))


def q(v):
    if v is None:
        return "null"
    if isinstance(v, int):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def values(rows):
    return ",\n".join("  (" + ", ".join(q(v) for v in r) + ")" for r in rows)


cats = [(c["slug"], c["name"], i + 1) for i, c in enumerate(data["categories"])]
svcs = [(s["slug"], s["name"], s.get("company"), s["category"], s.get("brand_color"), s.get("official_url")) for s in data["services"]]
plans = [
    (s["slug"], p["name"], p["price_jpy"], p["billing_cycle"], i, s["checked_on"])
    for s in data["services"]
    for i, p in enumerate(s["plans"])
]

print(f"""-- サービスマスタ（{len(svcs)}件、うち料金確認済み {len({p[0] for p in plans})}件）
-- scripts/catalog/to_sql.py で生成。手で編集しないこと。
begin;

insert into categories (slug, name, sort_order) values
{values(cats)}
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

create temp table _svc (slug text, name text, company text, category text, brand_color text, official_url text) on commit drop;
insert into _svc values
{values(svcs)};

insert into services (slug, name, company, category_id, brand_color, official_url)
select s.slug, s.name, s.company, c.id, s.brand_color, s.official_url
from _svc s join categories c on c.slug = s.category
on conflict (slug) do update set
  name = excluded.name,
  company = excluded.company,
  category_id = excluded.category_id,
  brand_color = coalesce(excluded.brand_color, services.brand_color),
  official_url = coalesce(excluded.official_url, services.official_url);

create temp table _plan (slug text, name text, price integer, cycle billing_cycle, sort_order smallint, checked date) on commit drop;
insert into _plan values
{values(plans)};

-- 名前と請求周期が同じプランは価格を更新
update plans p set price = x.price, price_checked_at = x.checked, sort_order = x.sort_order
from _plan x join services s on s.slug = x.slug
where p.service_id = s.id and p.name = x.name and p.billing_cycle = x.cycle;

-- 新しいプランを追加
insert into plans (service_id, name, price, billing_cycle, price_checked_at, sort_order)
select s.id, x.name, x.price, x.cycle, x.checked, x.sort_order
from _plan x join services s on s.slug = x.slug
where not exists (
  select 1 from plans p where p.service_id = s.id and p.name = x.name and p.billing_cycle = x.cycle
);

-- 料金を確認したサービスの、もう無いプランを削除（契約に使われているものは残す）
delete from plans p
using services s
where p.service_id = s.id
  and s.slug in (select slug from _plan)
  and not exists (select 1 from _plan x where x.slug = s.slug and x.name = p.name and x.cycle = p.billing_cycle)
  and not exists (select 1 from user_subscriptions u where u.plan_id = p.id);

-- 終了したサービスなどは非表示にする（契約の記録は残す）
update services set status = 'archived' where slug in ({", ".join(q(x) for x in data.get("archived", [])) or "null"});

-- 最初に入れた仮の料金（確認日 2026-10-01）は、契約に使われていなければ削除
delete from plans p
where p.price_checked_at = '2026-10-01'
  and not exists (select 1 from user_subscriptions u where u.plan_id = p.id);

commit;""")
