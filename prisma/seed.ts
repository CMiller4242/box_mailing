import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Workflow stages matching the current 8-step process ─────────────────────
  // Seeded as data so they can be extended without a schema change.
  const stages = [
    {
      name: 'Data Requested',
      description: 'Initial data request has been submitted.',
      sequence: 1,
      phaseGroup: 'Data Acquisition',
      isExternalStep: false,
      slaDays: 2,
    },
    {
      name: 'Data Pushed to CRM',
      description: 'Source data has been loaded into the CRM system.',
      sequence: 2,
      phaseGroup: 'Data Acquisition',
      isExternalStep: false,
      slaDays: 1,
    },
    {
      name: 'Data Pulled from CRM',
      description: 'List pulled from CRM based on mailing criteria.',
      sequence: 3,
      phaseGroup: 'Data Acquisition',
      isExternalStep: false,
      slaDays: 1,
    },
    {
      name: 'List Generated',
      description: 'Finalized list file generated and ready for verification.',
      sequence: 4,
      phaseGroup: 'List Processing',
      isExternalStep: false,
      slaDays: 1,
    },
    {
      name: 'List Sent for Name Verification',
      description: 'List file sent to third-party vendor for name verification.',
      sequence: 5,
      phaseGroup: 'List Processing',
      isExternalStep: true,
      slaDays: 10,
    },
    {
      name: 'Name Verified List Received',
      description: 'Verified list returned from vendor and ready for mail file creation.',
      sequence: 6,
      phaseGroup: 'List Processing',
      isExternalStep: false,
      slaDays: 1,
    },
    {
      name: 'Mail File Created',
      description: 'Formatted mail file produced and ready for printing.',
      sequence: 7,
      phaseGroup: 'Fulfillment',
      isExternalStep: false,
      slaDays: 2,
    },
    {
      name: 'Shipping Labels Printed',
      description: 'Labels printed and mailing ready to ship.',
      sequence: 8,
      phaseGroup: 'Fulfillment',
      isExternalStep: false,
      slaDays: 1,
    },
  ];

  for (const stage of stages) {
    await prisma.workflowStage.upsert({
      where: { name: stage.name },
      update: stage,
      create: stage,
    });
  }

  // ── Default teams ────────────────────────────────────────────────────────────
  const teams = ['Operations', 'Data', 'Fulfillment'];
  for (const name of teams) {
    await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // ── Seed admin user ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: 'admin@internal.local' },
    update: {},
    create: {
      email: 'admin@internal.local',
      name: 'System Admin',
      role: UserRole.ADMIN,
    },
  });

  // ── Default notification rules ───────────────────────────────────────────────
  const notificationRules = [
    {
      name: 'Stage SLA Overdue Alert',
      description: 'Fire when a job has exceeded its stage SLA.',
      triggerType: 'STAGE_OVERDUE' as const,
      offsetHours: 0,
      recipientType: 'ASSIGNEE',
    },
    {
      name: 'Due Date 48h Warning',
      description: 'Fire 48 hours before overall job due date.',
      triggerType: 'DUE_DATE_APPROACHING' as const,
      offsetHours: -48,
      recipientType: 'ASSIGNEE',
    },
    {
      name: 'Vendor Task Overdue Alert',
      description: 'Fire when vendor has not returned work by expected date.',
      triggerType: 'VENDOR_TASK_OVERDUE' as const,
      offsetHours: 0,
      recipientType: 'MANAGER',
    },
  ];

  for (const rule of notificationRules) {
    await prisma.notificationRule.upsert({
      where: { id: rule.name },
      update: {},
      create: rule,
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
