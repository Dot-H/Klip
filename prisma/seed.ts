/**
 * Adds seed data to your db
 *
 * @see https://www.prisma.io/docs/guides/database/seed-database
 *
 * For importing data from Excel, use: pnpm tsx prisma/import-excel.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.report.deleteMany();
  await prisma.pitch.deleteMany();
  await prisma.route.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.coordinator.deleteMany();
  await prisma.crag.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating test data...');

  // Create test users
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

  // Create crags
  const buoux = await prisma.crag.create({
    data: {
      name: 'Buoux',
      convention: true,
    },
  });

  const ceuse = await prisma.crag.create({
    data: {
      name: 'Céüse',
      convention: true,
    },
  });

  const verdon = await prisma.crag.create({
    data: {
      name: 'Verdon',
      convention: false,
    },
  });

  // Buoux sectors and routes
  const styx = await prisma.sector.create({
    data: {
      name: 'Styx',
      cragId: buoux.id,
    },
  });

  const boutDuMonde = await prisma.sector.create({
    data: {
      name: 'Bout du Monde',
      cragId: buoux.id,
    },
  });

  // Routes in Styx
  const roseDesSables = await prisma.route.create({
    data: {
      number: 1,
      name: 'Rose des Sables',
      sectorId: styx.id,
      length: 25,
    },
  });

  await prisma.pitch.create({
    data: {
      routeId: roseDesSables.id,
      cotation: '7a',
      length: 25,
      nbBolts: 10,
    },
  });

  const tabouAuNord = await prisma.route.create({
    data: {
      number: 2,
      name: 'Tabou au Nord',
      sectorId: styx.id,
      length: 30,
    },
  });

  const tabouPitch = await prisma.pitch.create({
    data: {
      routeId: tabouAuNord.id,
      cotation: '7b+',
      length: 30,
      nbBolts: 12,
    },
  });

  // Add a report to Tabou au Nord
  await prisma.report.create({
    data: {
      reportedPitchId: tabouPitch.id,
      reporterId: routeSetter.id,
      visualCheck: true,
      anchorCheck: true,
      cleaningDone: false,
      comment: 'Relais en bon état, quelques prises à nettoyer',
    },
  });

  // Routes in Bout du Monde
  const noName = await prisma.route.create({
    data: {
      number: 1,
      name: null,
      sectorId: boutDuMonde.id,
      length: 20,
    },
  });

  await prisma.pitch.create({
    data: {
      routeId: noName.id,
      cotation: '6a',
      length: 20,
      nbBolts: 8,
    },
  });

  // Céüse sectors and routes
  const biographiesSector = await prisma.sector.create({
    data: {
      name: 'Biographie',
      cragId: ceuse.id,
    },
  });

  const biographie = await prisma.route.create({
    data: {
      number: 1,
      name: 'Biographie',
      sectorId: biographiesSector.id,
      length: 50,
    },
  });

  await prisma.pitch.create({
    data: {
      routeId: biographie.id,
      cotation: '9a+',
      length: 50,
      nbBolts: 35,
    },
  });

  // Multi-pitch route in Verdon
  const grandeVoieSector = await prisma.sector.create({
    data: {
      name: 'Escalès',
      cragId: verdon.id,
    },
  });

  const pichenibule = await prisma.route.create({
    data: {
      number: 1,
      name: 'Pichenibule',
      sectorId: grandeVoieSector.id,
      description: 'Grande voie mythique du Verdon',
    },
  });

  const pitch1 = await prisma.pitch.create({
    data: {
      routeId: pichenibule.id,
      cotation: '6b',
      length: 35,
      nbBolts: 8,
      description: 'Départ en dalle technique',
    },
  });

  const pitch2 = await prisma.pitch.create({
    data: {
      routeId: pichenibule.id,
      cotation: '6c',
      length: 40,
      nbBolts: 10,
      description: 'La longueur clé avec un pas de bloc',
    },
  });

  const pitch3 = await prisma.pitch.create({
    data: {
      routeId: pichenibule.id,
      cotation: '6a+',
      length: 30,
      nbBolts: 7,
      description: 'Sortie en traversée aérienne',
    },
  });

  // Add reports to multi-pitch route
  await prisma.report.create({
    data: {
      reportedPitchId: pitch1.id,
      reporterId: admin.id,
      visualCheck: true,
      anchorCheck: true,
      cleaningDone: true,
      trundleDone: false,
      comment: 'L1 en parfait état',
    },
  });

  await prisma.report.create({
    data: {
      reportedPitchId: pitch2.id,
      reporterId: admin.id,
      visualCheck: true,
      anchorCheck: false,
      cleaningDone: false,
      totalReboltingDone: false,
      comment: 'Relais L2 à vérifier, plaquette mobile',
    },
  });

  await prisma.report.create({
    data: {
      reportedPitchId: pitch3.id,
      reporterId: contributor.id,
      visualCheck: true,
      anchorCheck: true,
      cleaningDone: true,
      comment: 'Tout est bon sur L3',
    },
  });

  // Make admin coordinator of Verdon
  await prisma.coordinator.create({
    data: {
      userId: admin.id,
      cragId: verdon.id,
    },
  });

  // Another route in Verdon without name
  const voie2 = await prisma.route.create({
    data: {
      number: 2,
      name: 'Luna Bong',
      sectorId: grandeVoieSector.id,
    },
  });

  await prisma.pitch.create({
    data: {
      routeId: voie2.id,
      cotation: '7a',
      length: 25,
      nbBolts: 9,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Created:');
  console.log('- 3 users (admin, route setter, contributor)');
  console.log('- 3 crags (Buoux, Céüse, Verdon)');
  console.log('- 4 sectors');
  console.log('- 6 routes (including 1 multi-pitch)');
  console.log('- 8 pitches');
  console.log('- 4 reports');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
