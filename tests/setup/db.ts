/**
 * Database setup for integration tests
 * Uses the test database configured in .env.test
 *
 * IMPORTANT: This must import the same prisma instance used by the app
 * to ensure tests run against the same database connection.
 */
import { prisma } from '~/server/prisma';

export { prisma };

/**
 * Clean all data from the database
 * Run this before each test to ensure a clean state
 */
export async function cleanDatabase() {
  await prisma.report.deleteMany();
  await prisma.pitch.deleteMany();
  await prisma.route.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.coordinator.deleteMany();
  await prisma.crag.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Seed test data
 * Creates minimal test data for integration tests
 */
export async function seedTestData() {
  const admin = await prisma.user.create({
    data: {
      firstname: 'Jean',
      lastname: 'Admin',
      email: 'admin@klip.test',
      role: 'ADMIN',
    },
  });

  const routeSetter = await prisma.user.create({
    data: {
      firstname: 'Pierre',
      lastname: 'Ouvreur',
      email: 'ouvreur@klip.test',
      role: 'ROUTE_SETTER',
    },
  });

  const contributor = await prisma.user.create({
    data: {
      firstname: 'Marie',
      lastname: 'Grimpeuse',
      email: 'marie@klip.test',
      role: 'CONTRIBUTOR',
    },
  });

  const buoux = await prisma.crag.create({
    data: {
      name: 'Buoux',
      convention: true,
    },
  });

  const verdon = await prisma.crag.create({
    data: {
      name: 'Verdon',
      convention: false,
    },
  });

  const styx = await prisma.sector.create({
    data: {
      name: 'Styx',
      cragId: buoux.id,
    },
  });

  const escales = await prisma.sector.create({
    data: {
      name: 'Escalès',
      cragId: verdon.id,
    },
  });

  const roseDesSables = await prisma.route.create({
    data: {
      number: 1,
      name: 'Rose des Sables',
      sectorId: styx.id,
      length: 25,
    },
  });

  const roseDesSablesPitch = await prisma.pitch.create({
    data: {
      routeId: roseDesSables.id,
      cotation: '7a',
      length: 25,
      nbBolts: 10,
    },
  });

  const pichenibule = await prisma.route.create({
    data: {
      number: 1,
      name: 'Pichenibule',
      sectorId: escales.id,
      description: 'Grande voie mythique du Verdon',
    },
  });

  const pitch1 = await prisma.pitch.create({
    data: {
      routeId: pichenibule.id,
      cotation: '6b',
      length: 35,
      nbBolts: 8,
    },
  });

  const pitch2 = await prisma.pitch.create({
    data: {
      routeId: pichenibule.id,
      cotation: '6c',
      length: 40,
      nbBolts: 10,
    },
  });

  return {
    users: { admin, routeSetter, contributor },
    crags: { buoux, verdon },
    sectors: { styx, escales },
    routes: { roseDesSables, pichenibule },
    pitches: { roseDesSablesPitch, pitch1, pitch2 },
  };
}

/**
 * Disconnect Prisma client
 * Call this in afterAll()
 */
export async function disconnectDatabase() {
  // No-op: Don't disconnect the shared prisma instance
  // as it may be used by other test files
}
