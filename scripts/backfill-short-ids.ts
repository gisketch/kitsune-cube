import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const SHORT_ID_LENGTH = 8

function generateShortId(): string {
  let id = ''
  const array = new Uint8Array(SHORT_ID_LENGTH)
  crypto.getRandomValues(array)
  for (let i = 0; i < SHORT_ID_LENGTH; i++) {
    id += CHARSET[array[i] % CHARSET.length]
  }
  return id
}

async function backfillShortIds() {
  if (getApps().length === 0) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    if (!serviceAccount) {
      console.error('FIREBASE_SERVICE_ACCOUNT environment variable is required')
      console.log('Set it to the path of your service account JSON file or the JSON content')
      process.exit(1)
    }

    try {
      const credential = serviceAccount.startsWith('{')
        ? cert(JSON.parse(serviceAccount))
        : cert(serviceAccount)

      initializeApp({ credential })
    } catch (error) {
      console.error('Failed to initialize Firebase:', error)
      process.exit(1)
    }
  }

  const db = getFirestore()
  const usedShortIds = new Set<string>()

  console.log('Fetching existing shortIds...')
  const existingSnapshot = await db.collectionGroup('solves')
    .where('shortId', '!=', null)
    .select('shortId')
    .get()

  existingSnapshot.forEach(doc => {
    const shortId = doc.data().shortId
    if (shortId) usedShortIds.add(shortId)
  })
  console.log(`Found ${usedShortIds.size} existing shortIds`)

  console.log('Fetching solves without shortId...')
  const solvesWithoutShortId = await db.collectionGroup('solves')
    .select()
    .get()

  const docsToUpdate = solvesWithoutShortId.docs.filter(doc => !doc.data().shortId)
  console.log(`Found ${docsToUpdate.length} solves without shortId`)

  if (docsToUpdate.length === 0) {
    console.log('All solves already have shortIds!')
    return
  }

  let updated = 0
  let failed = 0
  const batchSize = 500 

  for (let i = 0; i < docsToUpdate.length; i += batchSize) {
    const batch = db.batch()
    const chunk = docsToUpdate.slice(i, i + batchSize)

    for (const doc of chunk) {
      let shortId: string
      let attempts = 0
      const maxAttempts = 10

      do {
        shortId = generateShortId()
        attempts++
      } while (usedShortIds.has(shortId) && attempts < maxAttempts)

      if (attempts >= maxAttempts) {
        console.error(`Failed to generate unique shortId for ${doc.ref.path}`)
        failed++
        continue
      }

      usedShortIds.add(shortId)
      batch.update(doc.ref, { shortId })
      updated++
    }

    await batch.commit()
    console.log(`Progress: ${Math.min(i + batchSize, docsToUpdate.length)}/${docsToUpdate.length}`)
  }

  console.log(`\nBackfill complete!`)
  console.log(`Updated: ${updated}`)
  console.log(`Failed: ${failed}`)
}

backfillShortIds().catch(console.error)
