"""調査結果（グループごとの JSON）を 1 つのサービスマスタにまとめる。

使い方: python3 -I scripts/catalog/merge.py <調査フォルダ> [出力先]
出力先の既定は supabase/seed/catalog.json。
同じ slug が複数のグループにあるときは、確認済みの料金が多いほうを残す。
<調査フォルダ>/pass*/result-*.json と manual/*.json（手入力）があれば、その順で上書きする。
"""
import glob
import json
import os
import sys

CATEGORIES = [
    ("ai", "生成AI"),
    ("video", "動画"),
    ("music", "音楽"),
    ("books", "電子書籍・マンガ"),
    ("news", "ニュース・雑誌"),
    ("game", "ゲーム"),
    ("work", "仕事ツール"),
    ("dev", "開発・クラウド"),
    ("learning", "学習"),
    ("life", "暮らし・健康"),
    ("other", "その他"),
]
# 調査後に分類を見直したもの
CATEGORY_OVERRIDES = {"kindle-unlimited": "books", "grammarly": "work", "figma": "work"}

# 終了したサービス・日本で使えないサービス
EXCLUDE = {"gendai-premium", "crunchyroll", "au-smartpass", "hikari-tv-book", "menu-pass"}
# 既存の契約が参照しているプラン名に合わせる
PLAN_RENAMES = {("youtube-premium", "YouTube Premium"): "個人"}
CYCLE_SUFFIXES = {
    "monthly": ["（月額）", "（月払い）", "（月々払い）", " 月額", " 月払い", " 月々払い"],
    "yearly": ["（年額）", "（年払い）", " 年額", " 年払い"],
}


def tidy_plan_names(item: dict) -> None:
    """「（App Store）」やサービス名の繰り返し、請求周期の重複表記をプラン名から外す"""
    names = []
    for p in item["plans"]:
        n = p["name"].replace("（App Store）", "").replace("(App Store)", "").strip()
        if n.lower().startswith(item["name"].lower()):
            n = n[len(item["name"]):].strip() or n
        for suf in CYCLE_SUFFIXES[p["billing_cycle"]]:
            if n.endswith(suf) and len(n) > len(suf):
                n = n[: -len(suf)].strip()
        names.append(PLAN_RENAMES.get((item["slug"], n), n))
    keys = [(n, p["billing_cycle"]) for n, p in zip(names, item["plans"])]
    if len(set(keys)) == len(keys):  # 名前がぶつかるときは元のまま
        for n, p in zip(names, item["plans"]):
            p["name"] = n


src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "../../supabase/seed/catalog.json")
cats = {s for s, _ in CATEGORIES}

merged: dict[str, dict] = {}
# 再調査（pass2 以降）の結果は、最初の調査より優先して上書きする
first = sorted(glob.glob(os.path.join(src, "*.json")))
later = sorted(glob.glob(os.path.join(src, "pass*", "result-*.json"))) + sorted(glob.glob(os.path.join(src, "manual", "*.json")))
for path in first + later:
    for item in json.load(open(path, encoding="utf-8")):
        if item["slug"] in EXCLUDE:
            continue
        item = {k: v for k, v in item.items() if not k.startswith("_")}
        # 法人向けの高額プラン（年30万円超）は個人の構成に関係しないので外す
        item["plans"] = [p for p in item["plans"] if p["price_jpy"] <= 300000]
        tidy_plan_names(item)
        item["category"] = CATEGORY_OVERRIDES.get(item["slug"], item["category"])
        assert item["category"] in cats, (path, item["slug"], item["category"])
        for p in item["plans"]:
            assert isinstance(p["price_jpy"], int) and p["price_jpy"] >= 0, (item["slug"], p)
            assert p["billing_cycle"] in ("monthly", "yearly"), (item["slug"], p)
        prev = merged.get(item["slug"])
        if prev is None or path in later or len(item["plans"]) > len(prev["plans"]):
            merged[item["slug"]] = item

services = sorted(merged.values(), key=lambda s: ([c for c, _ in CATEGORIES].index(s["category"]), s["slug"]))
json.dump(
    {
        "categories": [{"slug": s, "name": n} for s, n in CATEGORIES],
        "services": services,
        "archived": sorted(EXCLUDE),  # 本番に入っていれば非表示にする
    },
    open(out, "w", encoding="utf-8"),
    ensure_ascii=False,
    indent=1,
)
verified = sum(1 for s in services if s["plans"])
print(f"{len(services)} services, {verified} with verified plans -> {out}")
