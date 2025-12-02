// Import local data to Cloudflare D1
import { cpuData, mainboardData, vgaData, ramData, ssdData, psuData, caseData, cpuCoolerData } from '../react-pc-builder/src/data/components.js'
import { intelConfigs, amdConfigs } from '../react-pc-builder/src/data/configs.js'

const API_BASE = process.env.API_BASE || 'https://tp-pc-builder-api.bangachieu2.workers.dev'
const PASSWORD = process.env.EDIT_PASSWORD || 'namhbcf12'

const categories = {
  cpu: cpuData,
  mainboard: mainboardData,
  vga: vgaData,
  ram: ramData,
  ssd: ssdData,
  psu: psuData,
  case: caseData,
  cpuCooler: cpuCoolerData
}

async function importInventory() {
  console.log('🚀 Importing inventory to D1...')
  let count = 0

  for (const [cat, items] of Object.entries(categories)) {
    console.log(`\n📦 Importing ${cat}...`)
    for (const [id, item] of Object.entries(items)) {
      try {
        const payload = {
          cat,
          id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 0,
          // Additional fields
          socket: item.socket,
          ddr: item.ddr,
          memoryType: item.memoryType,
          sockets: item.sockets,
          brand: item.brand,
          warranty: item.warranty,
          condition: item.condition,
          image: item.image || `/images/${id}.jpg`
        }

        const res = await fetch(`${API_BASE}/inventory`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!res.ok) {
          throw new Error(`Failed to import ${cat}/${id}: ${res.status}`)
        }

        count++
        process.stdout.write(`✓ ${id} `)
      } catch (err) {
        console.error(`\n❌ Error importing ${cat}/${id}:`, err.message)
      }
    }
  }

  console.log(`\n\n✅ Imported ${count} items!`)
}

async function importConfigs() {
  console.log('\n🎮 Importing configs to D1...')
  let count = 0

  // Import Intel configs
  console.log('\n📦 Importing Intel configs...')
  for (const [game, budgets] of Object.entries(intelConfigs)) {
    for (const [budgetKey, payload] of Object.entries(budgets)) {
      try {
        const res = await fetch(`${API_BASE}/configs`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            cpuType: 'intel',
            game,
            budgetKey,
            payload
          })
        })

        if (!res.ok) {
          throw new Error(`Failed to import intel/${game}/${budgetKey}`)
        }

        count++
        process.stdout.write(`✓ intel/${game}/${budgetKey} `)
      } catch (err) {
        console.error(`\n❌ Error:`, err.message)
      }
    }
  }

  // Import AMD configs
  console.log('\n\n📦 Importing AMD configs...')
  for (const [game, budgets] of Object.entries(amdConfigs)) {
    for (const [budgetKey, payload] of Object.entries(budgets)) {
      try {
        const res = await fetch(`${API_BASE}/configs`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            cpuType: 'amd',
            game,
            budgetKey,
            payload
          })
        })

        if (!res.ok) {
          throw new Error(`Failed to import amd/${game}/${budgetKey}`)
        }

        count++
        process.stdout.write(`✓ amd/${game}/${budgetKey} `)
      } catch (err) {
        console.error(`\n❌ Error:`, err.message)
      }
    }
  }

  console.log(`\n\n✅ Imported ${count} configs!`)
}

async function main() {
  console.log('🎯 PC Builder - D1 Data Import Tool')
  console.log(`📡 API: ${API_BASE}`)
  console.log('=' .repeat(50))

  try {
    await importInventory()
    await importConfigs()
    console.log('\n🎉 All data imported successfully!')
  } catch (err) {
    console.error('\n❌ Import failed:', err)
    process.exit(1)
  }
}

main()
