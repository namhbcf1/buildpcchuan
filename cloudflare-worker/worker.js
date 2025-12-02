// Cloudflare Worker for D1-backed inventory and configs
// Run with: wrangler dev
// wrangler.toml should bind D1 as DB and set EDIT_PASSWORD
// Minimal, no advanced security beyond simple password for writes

export default {
	async fetch(request, env) {
		try {
			const url = new URL(request.url)
			const { pathname, searchParams } = url
			const method = request.method.toUpperCase()

			// CORS preflight
			if (method === 'OPTIONS') {
				return cors(new Response(null, { status: 204 }))
			}

			// Routes
			if (pathname === '/health') {
				return json({ ok: true })
			}

			if (pathname === '/inventory' && method === 'GET') {
				const data = await allInventory(env.DB)
				return json(data)
			}

			if (pathname === '/configs' && method === 'GET') {
				const data = await allConfigs(env.DB)
				return json(data)
			}

			// NOTE: No API-level auth. Page-level password gate is used instead per requirements.

			if (pathname === '/inventory' && method === 'POST') {
				const body = await request.json()
				// body: { cat, id, name?, price?, quantity? } (upsert)
				await upsertInventory(env.DB, body)
				return json({ ok: true })
			}

			if (pathname.startsWith('/inventory/') && method === 'DELETE') {
				const [, , cat, id] = pathname.split('/')
				await deleteInventory(env.DB, cat, id)
				return json({ ok: true })
			}

			if (pathname === '/configs' && method === 'POST') {
				const body = await request.json()
				// body: { cpuType, game, budgetKey, payload }
				await upsertConfig(env.DB, body)
				return json({ ok: true })
			}

			if (pathname.startsWith('/configs/') && method === 'DELETE') {
				const [, , cpuType, game, budgetKey] = pathname.split('/')
				await deleteConfig(env.DB, cpuType, game, budgetKey)
				return json({ ok: true })
			}

			return json({ error: 'not_found' }, 404)
		} catch (err) {
			return json({ error: 'internal_error', message: String(err?.message || err) }, 500)
		}
	}
}

function json(data, status = 200) {
	return cors(new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }))
}

function cors(res) {
	const h = new Headers(res.headers)
	h.set('Access-Control-Allow-Origin', '*')
	h.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
	h.set('Access-Control-Allow-Headers', 'content-type,x-edit-password')
	return new Response(res.body, { status: res.status, headers: h })
}

// D1 schema helpers
// Tables:
// inventory(cat TEXT, id TEXT, name TEXT, price INTEGER, quantity INTEGER, details TEXT, PRIMARY KEY(cat,id))
// configs(cpuType TEXT, game TEXT, budgetKey TEXT, payload TEXT, PRIMARY KEY(cpuType,game,budgetKey))

async function allInventory(db) {
	const res = await db.prepare('SELECT cat,id,name,price,quantity,details FROM inventory').all()
	const out = {}
	for (const row of res.results) {
		out[row.cat] = out[row.cat] || {}
		// Parse details JSON if exists, otherwise use basic fields
		const details = row.details ? JSON.parse(row.details) : {}
		out[row.cat][row.id] = {
			id: row.id,
			name: row.name,
			price: row.price,
			quantity: row.quantity,
			...details // Spread all additional fields from details
		}
	}
	return out
}

async function upsertInventory(db, { cat, id, name, price, quantity, ...additionalFields }) {
	// Store all additional fields in details as JSON
	const details = Object.keys(additionalFields).length > 0 ? JSON.stringify(additionalFields) : null

	await db.prepare('INSERT INTO inventory(cat,id,name,price,quantity,details) VALUES(?1,?2,?3,?4,?5,?6) ON CONFLICT(cat,id) DO UPDATE SET name=COALESCE(excluded.name,name), price=COALESCE(excluded.price,price), quantity=COALESCE(excluded.quantity,quantity), details=COALESCE(excluded.details,details)')
		.bind(cat, id, name ?? null, typeof price === 'number' ? price : null, typeof quantity === 'number' ? quantity : null, details)
		.run()
}

async function deleteInventory(db, cat, id) {
	await db.prepare('DELETE FROM inventory WHERE cat=?1 AND id=?2').bind(cat, id).run()
}

async function allConfigs(db) {
	const res = await db.prepare('SELECT cpuType,game,budgetKey,payload FROM configs').all()
	const out = {}
	for (const row of res.results) {
		out[row.cpuType] = out[row.cpuType] || {}
		out[row.cpuType][row.game] = out[row.cpuType][row.game] || {}
		out[row.cpuType][row.game][row.budgetKey] = JSON.parse(row.payload)
	}
	return out
}

async function upsertConfig(db, { cpuType, game, budgetKey, payload }) {
	await db.prepare('INSERT INTO configs(cpuType,game,budgetKey,payload) VALUES(?1,?2,?3,?4) ON CONFLICT(cpuType,game,budgetKey) DO UPDATE SET payload=excluded.payload')
		.bind(cpuType, game, budgetKey, JSON.stringify(payload))
		.run()
}

async function deleteConfig(db, cpuType, game, budgetKey) {
	await db.prepare('DELETE FROM configs WHERE cpuType=?1 AND game=?2 AND budgetKey=?3')
		.bind(cpuType, game, budgetKey)
		.run()
}
