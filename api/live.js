// YouTube で「日本・ライブ配信中・埋め込み可」のライブカメラを探して返す
// 使い方: /api/live?cat=kuko
// 環境変数 YOUTUBE_API_KEY が必要（Vercel の Settings → Environment Variables）

const CATEGORIES = {
  sora: { label: '空', terms: ['空', '青空', '夜空', '星空', '雲', '朝焼け', '夕焼け'] },
  kuko: { label: '空港', terms: ['空港', '羽田', '成田', '伊丹', '関西空港', '滑走路'] },
  kasenjiki: { label: '河川敷', terms: ['河川敷', '河川', '川', '堤防'] },
  kosoku: { label: '高速道路', terms: ['高速道路', '首都高', 'インターチェンジ', '道路'] },
  toshi: { label: '都市', terms: ['渋谷', '新宿', '東京', '大阪', 'スクランブル交差点', '街並み'] },
  denen: { label: '田園風景', terms: ['田園', '田んぼ', '里山', '棚田', '農村'] },
  umi: { label: '海', terms: ['海', '海岸', '砂浜', '港', '漁港', '湾'] },
  jinja: { label: '神社仏閣', terms: ['神社', '寺', '寺院', '鳥居', '参道', '境内'] },
  dobutsu: { label: '動物', terms: ['動物', '動物園', '水族館', '猫', '犬', '鳥', 'パンダ'] },
  tennai: { label: '店内', terms: ['店内', 'カフェ', '商店', '書店', 'レストラン', 'ショップ'] },
  moriyama: { label: '森・山', terms: ['森', '森林', '山', '山頂', '富士山', '山岳'] },
  random: { label: 'ランダム', terms: ['日本', '風景', '景色', '街', '海', '山', '駅'] },
};

// タイトルやチャンネル名にこれが入っていたら除外（ゲーム実況などを弾く）
const EXCLUDE = [
  'ゲーム', '実況', '雑談', '歌枠', 'vtuber', 'マイクラ', 'minecraft',
  'フォートナイト', 'apex', '麻雀', 'パチンコ', 'スロット', 'asmr',
];

// 検索結果をVercelのCDNに3時間キャッシュ → APIの無料枠を節約
// （12ボタン × 1日8回更新 × 101ユニット ≒ 9,700 で無料枠1万に収まる）
const CACHE = 's-maxage=10800, stale-while-revalidate=3600';

export default async function handler(req, res) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY が設定されていません' });
  }

  const cat = CATEGORIES[req.query.cat];
  if (!cat) {
    return res.status(400).json({ error: '不明なカテゴリです' });
  }

  try {
    // 1) 配信中のライブを検索（1回 = 100ユニット消費）
    const q = `${cat.terms.join('|')} ライブカメラ`;
    const searchParams = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      eventType: 'live',
      q,
      regionCode: 'JP',
      relevanceLanguage: 'ja',
      maxResults: '50',
      key,
    });
    const sr = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
    const sj = await sr.json();
    if (!sr.ok) throw new Error(sj.error?.message || '検索に失敗しました');

    const ids = (sj.items || []).map((i) => i.id?.videoId).filter(Boolean);
    if (ids.length === 0) {
      res.setHeader('Cache-Control', CACHE);
      return res.json({ label: cat.label, items: [] });
    }

    // 2) 埋め込み可能か確認（1ユニット消費）
    const videoParams = new URLSearchParams({
      part: 'snippet,status',
      id: ids.join(','),
      key,
    });
    const vr = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videoParams}`);
    const vj = await vr.json();
    if (!vr.ok) throw new Error(vj.error?.message || '動画情報の取得に失敗しました');

    const items = (vj.items || [])
      .filter((v) => v.status?.embeddable && v.snippet?.liveBroadcastContent === 'live')
      .filter((v) => {
        const text = `${v.snippet.title} ${v.snippet.channelTitle}`.toLowerCase();
        return !EXCLUDE.some((w) => text.includes(w.toLowerCase()));
      })
      .map((v) => ({
        id: v.id,
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
      }));

    res.setHeader('Cache-Control', CACHE);
    return res.json({ label: cat.label, items });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: e.message });
  }
}
