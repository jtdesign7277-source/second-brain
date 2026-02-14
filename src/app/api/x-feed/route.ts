import { NextResponse } from "next/server";
import crypto from "crypto";

const API_KEY = "C8ywYbObezn5XwAbCrFMBBSkJ";
const API_SECRET = "E05ivLuW0miiMKFacW6RHDI09y4pT7OcrRVPNM3LMKEy7OACmO";
const ACCESS_TOKEN = "2016113405451526144-9HY8DCKCaEMJyesWdhEVkavyECRTB6";
const ACCESS_SECRET = "smKBnBtIHWBFqcfNQrdTwUoSB6DVRFbsbC5BPxoisGZlT";
const USER_ID = "2022444401587277824";

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

export async function GET() {
  try {
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
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
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
