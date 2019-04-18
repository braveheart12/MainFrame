// @flow

import type { RxDatabase } from 'rxdb'

import { COLLECTION_NAMES } from '../constants'

import schema from '../schemas/contactRequest'

export default async (db: RxDatabase) => {
  return await db.collection({
    name: COLLECTION_NAMES.CONTACT_REQUESTS,
    schema,
  })
}
