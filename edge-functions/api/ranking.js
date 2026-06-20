import { setEnv, getRankings } from "../../_shared/db.js";

export async function onRequestGet({ env }) {
  try {
    setEnv(env);
    const rankings = await getRankings();
    return new Response(JSON.stringify(rankings), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Ranking: " + (e.message || String(e)) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
