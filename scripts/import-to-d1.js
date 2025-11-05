/*
Usage:
  node scripts/import-to-d1.js --api https://<worker-url> --password namhbcf12
*/
const fs = require('fs')
const path = require('path')
const vm = require('vm')

const args = process.argv.slice(2)
const api = getArg('--api')
const password = getArg('--password') || 'namhbcf12'
if (!api) {
	console.error('Missing --api <worker-url>')
	process.exit(1)
}

async function main() {
	const root = path.resolve(__dirname, '..')
	const dataDir = path.join(root, 'js', 'data')
	const cfgDir = path.join(root, 'js', 'configs')

	const ctx = {
		window: {},
		console,
		// Add more globals if needed
		module: { exports: {} },
		exports: {}
	}
	vm.createContext(ctx)

	console.log('🔄 Loading data files...')
	// Load all data files into window
	const dataFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.js') && f.toLowerCase() !== 'index.js')
	let loadedFiles = 0
	for (const f of dataFiles) {
		try {
			let code = fs.readFileSync(path.join(dataDir, f), 'utf8')
			// Skip files with ES6 imports/exports
			if (/^\s*(import|export)\s+/m.test(code)) {
				console.log(`⏭️  Skipping ${f} (ES6 module)`)
				continue
			}
			// Remove any export statements that might be at the end
			code = code.replace(/^\s*export\s+{[^}]*}\s*;?\s*$/gm, '')
			vm.runInContext(code, ctx, { filename: f })
			loadedFiles++
			console.log(`✅ Loaded ${f}`)
		} catch (err) {
			console.error(`❌ Error loading ${f}:`, err.message)
		}
	}
	console.log(`\n📊 Loaded ${loadedFiles}/${dataFiles.length} data files\n`)

	// Build inventory per categories from window.*Data
	const cats = ['cpu','mainboard','vga','ram','ssd','psu','case','cpuCooler','hdd','monitor']
	let totalItems = 0
	let failedItems = 0

	console.log('📦 Importing inventory items...')
	for (const cat of cats) {
		const obj = ctx.window[cat + 'Data'] || {}
		const items = Object.entries(obj)
		if (items.length === 0) {
			console.log(`⚠️  No data found for category: ${cat}`)
			continue
		}

		process.stdout.write(`   ${cat}: `)
		for (const [id, item] of items) {
			try {
				// Send ALL fields from the item object
				const payload = {
					cat,
					id,
					name: item.name,
					price: item.price || 0,
					quantity: item.quantity || 1,
					// Spread all other fields (brand, warranty, condition, specs, etc.)
					...item
				}

				const response = await fetch(`${api}/inventory?password=${encodeURIComponent(password)}`, {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(payload)
				})
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`)
				}
				totalItems++
				process.stdout.write('.')
			} catch (err) {
				failedItems++
				process.stdout.write('✗')
				console.error(`\n   ❌ Failed to import ${cat}:${id} - ${err.message}`)
			}
		}
		console.log(` ${items.length} items`)
	}
	console.log(`\n✅ Imported ${totalItems} inventory items` + (failedItems > 0 ? ` (${failedItems} failed)` : ''))

	// Load configs
	console.log('\n🎮 Loading config files...')
	function loadConfigs(sub) {
		const dir = path.join(cfgDir, sub)
		if (!fs.existsSync(dir)) {
			console.log(`⚠️  Directory not found: ${sub}`)
			return 0
		}
		const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f.toLowerCase() !== 'index.js')
		let loaded = 0
		for (const f of files) {
			try {
				let code = fs.readFileSync(path.join(dir, f), 'utf8')
				if (/^\s*(import|export)\s+/m.test(code)) {
					console.log(`   ⏭️  Skipping ${sub}/${f} (ES6 module)`)
					continue
				}
				code = code.replace(/^\s*export\s+{[^}]*}\s*;?\s*$/gm, '')
				vm.runInContext(code, ctx, { filename: `${sub}/${f}` })
				loaded++
				console.log(`   ✅ Loaded ${sub}/${f}`)
			} catch (err) {
				console.error(`   ❌ Error loading ${sub}/${f}:`, err.message)
			}
		}
		return loaded
	}

	const intelLoaded = loadConfigs('intel')
	const amdLoaded = loadConfigs('amd')
	console.log(`\n📊 Loaded ${intelLoaded + amdLoaded} config files\n`)

	const intelCfg = ctx.window.intelConfigs || {}
	const amdCfg = ctx.window.amdConfigs || {}
	let cfgCount = 0
	let failedCfgs = 0

	console.log('⚙️  Importing configs...')

	// Import Intel configs
	const intelGames = Object.keys(intelCfg)
	if (intelGames.length > 0) {
		console.log(`   Intel configs (${intelGames.length} games):`)
		for (const [game, budgets] of Object.entries(intelCfg)) {
			process.stdout.write(`      ${game}: `)
			let gameConfigs = 0
			for (const [budgetKey, payload] of Object.entries(budgets)) {
				try {
					const response = await fetch(`${api}/configs?password=${encodeURIComponent(password)}`, {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ cpuType: 'intel', game, budgetKey, payload })
					})
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`)
					}
					cfgCount++
					gameConfigs++
					process.stdout.write('.')
				} catch (err) {
					failedCfgs++
					process.stdout.write('✗')
				}
			}
			console.log(` ${gameConfigs} configs`)
		}
	}

	// Import AMD configs
	const amdGames = Object.keys(amdCfg)
	if (amdGames.length > 0) {
		console.log(`   AMD configs (${amdGames.length} games):`)
		for (const [game, budgets] of Object.entries(amdCfg)) {
			process.stdout.write(`      ${game}: `)
			let gameConfigs = 0
			for (const [budgetKey, payload] of Object.entries(budgets)) {
				try {
					const response = await fetch(`${api}/configs?password=${encodeURIComponent(password)}`, {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ cpuType: 'amd', game, budgetKey, payload })
					})
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`)
					}
					cfgCount++
					gameConfigs++
					process.stdout.write('.')
				} catch (err) {
					failedCfgs++
					process.stdout.write('✗')
				}
			}
			console.log(` ${gameConfigs} configs`)
		}
	}

	console.log(`\n✅ Imported ${cfgCount} configs` + (failedCfgs > 0 ? ` (${failedCfgs} failed)` : ''))
	console.log('\n🎉 Import complete!')
}

function getArg(k) {
	const i = args.indexOf(k)
	if (i === -1) return null
	return args[i+1]
}

main().catch(e => { console.error(e); process.exit(1) })
