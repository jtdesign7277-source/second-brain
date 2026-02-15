import { NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = "C8ywYbObezn5XwAbCrFMBBSkJ";
const API_SECRET = "E05ivLuW0miiMKFacW6RHDI09y4pT7OcrRVPNM3LMKEy7OACmO";
const ACCESS_TOKEN = "2016113405451526144-9HY8DCKCaEMJyesWdhEVkavyECRTB6";
const ACCESS_SECRET = "smKBnBtIHWBFqcfNQrdTwUoSB6DVRFbsbC5BPxoisGZlT";

function percentEncode(str: string) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

function generateOAuth(method: string, url: string, params: Record<string, string>) {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys.map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`).join("&");
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(API_SECRET)}&${percentEncode(ACCESS_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;
  return "OAuth " + Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(", ");
}

// Rotating search queries for viral market/finance tweets
const QUERIES = [
  "(breaking OR 🚨) (stock OR market OR $SPY OR $QQQ OR $TSLA OR $NVDA) min_faves:50",
  "($TSLA OR $NVDA OR $AAPL OR $AMZN OR $GOOG) (surge OR crash OR soar OR plunge OR moon OR dump) min_faves:20",
  "(Fed OR FOMC OR CPI OR inflation OR recession OR rate) (breaking OR alert OR just) min_faves:30",
  "(crypto OR bitcoin OR $BTC OR $ETH OR $SOL) (breaking OR 🚨 OR pump OR crash) min_faves:20",
  "(IPO OR acquisition OR merger OR buyout OR SEC) (breaking OR announced OR confirms) min_faves:20",
];

export async function GET() {
  try {
    // Pick a query based on the hour (rotates through the day)
    const hour = new Date().getHours();
    const query = QUERIES[hour % QUERIES.length];

    const url = "https://api.twitter.com/2/tweets/search/recent";
    const params: Record<string, string> = {
      query: `${query} -is:retweet lang:en`,
      max_results: "10",
      sort_order: "relevancy",
      "tweet.fields": "created_at,public_metrics,author_id",
      "user.fields": "name,username,profile_image_url,verified",
      expansions: "author_id",
    };

    const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const fullUrl = `${url}?${queryString}`;
    const authHeader = generateOAuth("GET", url, params);

    const res = await fetch(fullUrl, {
      headers: { Authorization: authHeader },
      next: { revalidate: 300 }, // cache 5 min
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `X API error: ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();

    const users = new Map<string, { name: string; username: string; profile_image_url?: string }>();
    if (data.includes?.users) {
      for (const u of data.includes.users) {
        users.set(u.id, { name: u.name, username: u.username, profile_image_url: u.profile_image_url });
      }
    }

    // Sort by engagement (likes + retweets)
    const tweets = (data.data ?? [])
      .map((t: Record<string, unknown>) => ({
        ...t,
        author: users.get(t.author_id as string) ?? null,
      }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aMetrics = a.public_metrics as { like_count: number; retweet_count: number } | undefined;
        const bMetrics = b.public_metrics as { like_count: number; retweet_count: number } | undefined;
        const aScore = (aMetrics?.like_count ?? 0) + (aMetrics?.retweet_count ?? 0) * 3;
        const bScore = (bMetrics?.like_count ?? 0) + (bMetrics?.retweet_count ?? 0) * 3;
        return bScore - aScore;
      });

    return NextResponse.json({ data: tweets });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
