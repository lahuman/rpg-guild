import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    buildMemberReport,
    formatReportPeriodLabel,
    getMemberReportPeriod
} from './report.ts';

const memberId = 'char-1';

test('weekly report period starts Monday and ends Sunday', () => {
    const period = getMemberReportPeriod('weekly', new Date('2026-06-10T12:00:00.000Z'));

    assert.equal(period.start.getFullYear(), 2026);
    assert.equal(period.start.getMonth(), 5);
    assert.equal(period.start.getDate(), 8);
    assert.equal(period.start.getHours(), 0);
    assert.equal(period.start.getMinutes(), 0);
    assert.equal(period.end.getFullYear(), 2026);
    assert.equal(period.end.getMonth(), 5);
    assert.equal(period.end.getDate(), 14);
    assert.equal(period.end.getHours(), 23);
    assert.equal(period.end.getMinutes(), 59);
    assert.equal(formatReportPeriodLabel(period), '2026-06-08 - 2026-06-14');
});

test('monthly report period covers the current month', () => {
    const period = getMemberReportPeriod('monthly', new Date('2026-02-14T12:00:00.000Z'));

    assert.equal(formatReportPeriodLabel(period), '2026-02-01 - 2026-02-28');
});

test('yearly report period covers the current year', () => {
    const period = getMemberReportPeriod('yearly', new Date('2026-12-31T12:00:00.000Z'));

    assert.equal(formatReportPeriodLabel(period), '2026-01-01 - 2026-12-31');
});

test('member report includes missions and purchases for the selected period only', () => {
    const period = getMemberReportPeriod('weekly', new Date('2026-06-10T12:00:00.000Z'));

    const report = buildMemberReport({
        memberId,
        period,
        missionLogs: [
            {
                id: 'solo-in-period',
                missionId: 'mission-1',
                missionTitle: 'Solo Quest',
                performerCharacterIds: [memberId],
                performerNames: ['Rin'],
                totalReward: 40,
                createdAt: new Date('2026-06-09T03:00:00.000Z')
            },
            {
                id: 'party-in-period',
                missionId: 'mission-2',
                missionTitle: 'Party Raid',
                performerCharacterIds: [memberId, 'char-2'],
                performerNames: ['Rin', 'Mira'],
                totalReward: 100,
                createdAt: new Date('2026-06-11T03:00:00.000Z')
            },
            {
                id: 'attendance-excluded',
                missionId: 'ATTENDANCE',
                missionTitle: '출석 보상',
                performerCharacterIds: [memberId],
                performerNames: ['Rin'],
                totalReward: 1,
                createdAt: new Date('2026-06-12T03:00:00.000Z')
            },
            {
                id: 'outside-period',
                missionId: 'mission-3',
                missionTitle: 'Old Quest',
                performerCharacterIds: [memberId],
                performerNames: ['Rin'],
                totalReward: 500,
                createdAt: new Date('2026-06-01T03:00:00.000Z')
            },
            {
                id: 'other-member',
                missionId: 'mission-4',
                missionTitle: 'Other Quest',
                performerCharacterIds: ['char-2'],
                performerNames: ['Mira'],
                totalReward: 70,
                createdAt: new Date('2026-06-10T03:00:00.000Z')
            }
        ],
        usageLogs: [
            {
                id: 'purchase-in-period',
                characterId: memberId,
                characterName: 'Rin',
                itemName: 'Coffee Coupon',
                cost: 30,
                usedAt: new Date('2026-06-10T04:00:00.000Z')
            },
            {
                id: 'purchase-outside-period',
                characterId: memberId,
                characterName: 'Rin',
                itemName: 'Old Snack',
                cost: 60,
                usedAt: new Date('2026-05-30T04:00:00.000Z')
            },
            {
                id: 'other-member-purchase',
                characterId: 'char-2',
                characterName: 'Mira',
                itemName: 'Tea',
                cost: 20,
                usedAt: new Date('2026-06-10T04:00:00.000Z')
            }
        ]
    });

    assert.equal(report.summary.missionCount, 2);
    assert.equal(report.summary.missionGoldEarned, 90);
    assert.equal(report.summary.purchaseCount, 1);
    assert.equal(report.summary.purchaseGoldSpent, 30);
    assert.deepEqual(report.missions.map((mission) => mission.title), ['Party Raid', 'Solo Quest']);
    assert.deepEqual(report.purchases.map((purchase) => purchase.itemName), ['Coffee Coupon']);
});
