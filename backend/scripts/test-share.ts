import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testShare() {
  const storyId = '2356a337-8b05-4a0d-a5d4-43db8dae398c';
  const anonymousId = 'anonymous_test123456789012345678901234';

  console.log('1. Checking if story exists...');
  const story = await prisma.story.findUnique({ where: { id: storyId } });
  console.log('Story:', story ? 'Found' : 'Not found');

  console.log('\n2. Checking existing shares for this story...');
  const existingShares = await prisma.share.findMany({
    where: { storyId },
  });
  console.log('Existing shares:', existingShares.length);
  existingShares.forEach(s => {
    console.log(`  - id: ${s.id}, anonymousId: ${s.anonymousId}, childId: ${s.childId}`);
  });

  console.log('\n3. Checking for anonymous share...');
  const anonymousShare = await prisma.share.findFirst({
    where: { anonymousId, storyId },
  });
  console.log('Anonymous share exists:', !!anonymousShare);

  console.log('\n4. Trying to create new share...');
  try {
    const newShare = await prisma.share.create({
      data: {
        anonymousId,
        storyId,
        type: 'STORY',
        platform: 'test',
      },
    });
    console.log('Share created successfully:', newShare.id);
  } catch (error: any) {
    console.error('Error creating share:', error.message);
    console.error('Error code:', error.code);
  }

  await prisma.$disconnect();
}

testShare();