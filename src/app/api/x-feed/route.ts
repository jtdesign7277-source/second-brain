import { NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = "C8ywYbObezn5XwAbCrFMBBSkJ";
const API_SECRET = "E05ivLuW0miiMKFacW6RHDI09y4pT7OcrRVPNM3LMKEy7OACmO";
const ACCESS_TOKEN = "2016113405451526144-9HY8DCKCaEMJyesWdhEVkavyECRTB6";
const ACCESS_SECRET = "smKBnBtIHWBFqcfNQrdTwUoSB6DVRFbsbC5BPxoisGZlT";
const USER_ID = "2016113405451526144";

// Accounts to follow in the "Following" feed
const FOLLOWING_ACCOUNTS = [
  "elonmusk",
  "unusual_whales",
  "WatcherGuru",
  "zaborsky",
  "TrendSpider",
  "jimcramer",
  "CathieDWood",
  "chaaborsa",
  "DeItaone",
  "WSJ",
];

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
  const authHeader = "OAuth " + Object.keys(oauthParams).sort().map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`).join(", ");

  return authHeader;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const feed = searchParams.get("feed") || "mine";

  try {
    if (feed === "following") {
      // Search recent tweets from followed accounts
      const query = FOLLOWING_ACCOUNTS.map((u) => `from:${u}`).join(" OR ");
      const url = "https://api.twitter.com/2/tweets/search/recent";
      const params: Record<string, string> = {
        query,
        max_results: "20",
        "tweet.fields": "created_at,public_metrics,author_id",
        "user.fields": "name,username,verified",
        expansions: "author_id",
      };

      const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
      const fullUrl = `${url}?${queryString}`;
      const authHeader = generateOAuth("GET", url, params);

      const res = await fetch(fullUrl, {
        headers: { Authorization: authHeader },
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json({ error: `X API error: ${res.status}`, detail: text }, { status: res.status });
      }

      const data = await res.json();

      // Map author info onto tweets
      const users = new Map<string, { name: string; username: string }>();
      if (data.includes?.users) {
        for (const u of data.includes.users) {
          users.set(u.id, { name: u.name, username: u.username });
        }
      }

      const tweets = (data.data ?? []).map((t: Record<string, unknown>) => ({
        ...t,
        author: users.get(t.author_id as string) ?? null,
      }));

      return NextResponse.json({ data: tweets });
    }

    // Default: my tweets
    const url = `https://api.twitter.com/2/users/${USER_ID}/tweets`;
    const params: Record<string, string> = {
      max_results: "20",
      "tweet.fields": "created_at,public_metrics,text",
      expansions: "referenced_tweets.id",
    };

    const queryString = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    const fullUrl = `${url}?${queryString}`;
    const authHeader = generateOAuth("GET", url, params);

    const res = await fetch(fullUrl, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `X API error: ${res.status}`, detail: text }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
