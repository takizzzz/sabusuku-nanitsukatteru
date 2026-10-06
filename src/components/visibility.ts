import { Globe, Link2, Lock } from "lucide-react";

/** 公開範囲（F-11）の選択肢 */
export const VISIBILITY_OPTIONS = [
  { id: "public", label: "全体に公開", help: "構成一覧や検索に載り、誰でも見られます。", icon: Globe },
  { id: "unlisted", label: "限定公開", help: "URLを知っている人だけが見られます。一覧には載りません。", icon: Link2 },
  { id: "private", label: "非公開（自分のみ）", help: "自分だけが見られます。集計にも使いません。", icon: Lock },
] as const;
