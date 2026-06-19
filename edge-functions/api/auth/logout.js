export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": "invest_user=; Path=/; Max-Age=0; HttpOnly",
    },
  });
}
