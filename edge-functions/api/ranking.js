export async function onRequestGet({ env }) {
  const raw = await env.INVEST_KV.get("db");
  if (!raw) {
    return new Response(JSON.stringify([]), {
      headers: { "content-type": "application/json" },
    });
  }

  const db = JSON.parse(raw);
  const users = db.users || [];
  const reports = db.reports || [];

  const rankings = users.map((user) => {
    const userReports = reports
      .filter((r) => r.userId === user.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const latestAsset = userReports.length > 0 ? userReports[0].totalAsset : user.initCapital;
    const returnRate = ((latestAsset - user.initCapital) / user.initCapital) * 100;

    return {
      userId: user.id,
      slug: user.slug,
      name: user.name,
      nickname: user.nickname,
      totalAsset: latestAsset,
      initCapital: user.initCapital,
      returnRate: Math.round(returnRate * 100) / 100,
      reportCount: userReports.length,
    };
  });

  rankings.sort((a, b) => b.returnRate - a.returnRate);

  return new Response(JSON.stringify(rankings), {
    headers: { "content-type": "application/json" },
  });
}
