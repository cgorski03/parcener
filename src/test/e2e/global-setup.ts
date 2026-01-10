import { closeDatabase, resetDatabase } from './db';

export default async function globalSetup() {
  console.log('E2E: Resetting test database...');
  await resetDatabase();
  await closeDatabase();
  console.log('E2E: Database reset complete');
}
