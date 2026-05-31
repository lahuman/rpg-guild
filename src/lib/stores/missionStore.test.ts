import { missionStore, type Mission } from './missionStore';

const fundedMission = {
    id: 'mission-1',
    title: '긴급 도움 요청',
    description: '오늘 안에 처리',
    cost: 100,
    type: 'party',
    minParticipants: 1,
    maxParticipants: 3,
    creatorId: 'user-1',
    status: 'active',
    isOneTime: true,
    fundingType: 'character',
    sponsorCharacterId: 'char-1',
    sponsorCharacterName: 'Mira',
    bountyTotalGold: 300,
    bountyRemainingGold: 300,
    bountyExpiresAt: null
} satisfies Mission;

export const fundedMissionStoreCompileAssertions = {
    fundedMission,
    addFundedMissionExists: missionStore.addFundedMission,
    expireFundedMissionExists: missionStore.expireFundedMission
};
