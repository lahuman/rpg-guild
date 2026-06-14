import type { Mission } from '$lib/stores/missionStore';
import type { Guild, GuildCharacter } from '$lib/stores/guildStore';
import { missionStore } from '$lib/stores/missionStore';
import { confirmAction, createMissionForm, notify } from '$lib';
import { calculateBountyTotalGold } from './bounty';
import type { RewardChestResult } from './rewardChest';

export function sortMissionsAction(missions: Mission[], completedIds: Set<string>) {
    const missionTypeOrder: Record<Mission['type'], number> = {
        solo: 0,
        assigned: 1,
        party: 2
    };

    return [...missions].sort((a, b) => {
        const isDoneA = completedIds.has(a.id || '');
        const isDoneB = completedIds.has(b.id || '');
        if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;

        const oneTimeA = !!a.isOneTime;
        const oneTimeB = !!b.isOneTime;
        if (oneTimeA !== oneTimeB) return oneTimeA ? 1 : -1;

        if (a.type !== b.type) {
            return missionTypeOrder[a.type] - missionTypeOrder[b.type];
        }

        return 0;
    });
}

export function resetMissionFormAction() {
    return {
        newMission: createMissionForm(),
        editingMissionId: null
    };
}

export async function saveMissionAction(
    guildId: string,
    editingMissionId: string | null,
    newMission: ReturnType<typeof createMissionForm>
) {
    if (!newMission.title) {
        notify('퀘스트명을 입력해주세요.');
        return {
            shouldClose: false,
            ...resetMissionFormAction(),
            preservedMission: newMission as ReturnType<typeof createMissionForm> | null
        };
    }

    if (newMission.type === 'assigned' && !newMission.assignedCharacterId) {
        notify('배정할 멤버를 선택해주세요.');
        return {
            shouldClose: false,
            ...resetMissionFormAction(),
            preservedMission: newMission as ReturnType<typeof createMissionForm> | null
        };
    }

    const normalizedMission = {
        ...newMission,
        minParticipants: 1,
        maxParticipants: newMission.type === 'party' ? newMission.maxParticipants : 1,
        assignedCharacterId: newMission.type === 'assigned' ? newMission.assignedCharacterId : '',
        assignedCharacterName: newMission.type === 'assigned' ? newMission.assignedCharacterName : ''
    };

    if (editingMissionId) {
        await missionStore.updateMission(guildId, editingMissionId, normalizedMission);
        notify('퀘스트가 수정되었습니다.');
        return {
            shouldClose: true,
            ...resetMissionFormAction(),
            preservedMission: null as ReturnType<typeof createMissionForm> | null
        };
    }

    await missionStore.addMission(guildId, normalizedMission);
    return {
        shouldClose: false,
        ...resetMissionFormAction(),
        preservedMission: null as ReturnType<typeof createMissionForm> | null
    };
}

export async function saveFundedMissionAction(
    guildId: string,
    sponsorCharacter: GuildCharacter,
    newMission: ReturnType<typeof createMissionForm>
) {
    if (!newMission.title) {
        notify('퀘스트명을 입력해주세요.');
        return false;
    }

    if (newMission.type === 'assigned' && !newMission.assignedCharacterId) {
        notify('배정할 멤버를 선택해주세요.');
        return false;
    }

    const normalizedCost = Math.max(0, Number(newMission.cost) || 0);
    const normalizedMaxParticipants =
        newMission.type === 'party' ? Math.max(2, Number(newMission.maxParticipants) || 2) : 1;
    const bountyTotalGold = calculateBountyTotalGold(
        normalizedCost,
        newMission.type,
        normalizedMaxParticipants
    );

    if ((sponsorCharacter.currentGold || 0) < bountyTotalGold) {
        notify(`골드가 부족합니다! (보유: ${sponsorCharacter.currentGold || 0} G / 필요: ${bountyTotalGold} G)`);
        return false;
    }

    await missionStore.addFundedMission(guildId, {
        ...newMission,
        cost: normalizedCost,
        minParticipants: 1,
        maxParticipants: normalizedMaxParticipants,
        assignedCharacterId: newMission.type === 'assigned' ? newMission.assignedCharacterId : '',
        assignedCharacterName: newMission.type === 'assigned' ? newMission.assignedCharacterName : '',
        isOneTime: true,
        sponsorCharacterId: sponsorCharacter.id!,
        sponsorCharacterName: sponsorCharacter.name
    });

    notify('지정 미션이 등록되었습니다.');
    return true;
}

export function startEditMissionAction(mission: Mission) {
    return {
        newMission: { ...mission, isOneTime: mission.isOneTime ?? false },
        editingMissionId: mission.id!,
        isCreating: true
    };
}

export async function deleteMissionAction(guildId: string, mission: Mission) {
    if (!confirmAction(`🗑️ 정말 삭제하시겠습니까?\n[${mission.title}] 퀘스트가 목록에서 사라집니다.`)) {
        return;
    }

    await missionStore.deleteMission(guildId, mission.id!);
}

export async function openCompleteMissionModalAction(guildId: string, mission: Mission) {
    const logs = await missionStore.fetchMissionLogsByDate(guildId, mission.id!);
    const doneIds = new Set<string>();

    logs.forEach((log) => {
        log.performerCharacterIds?.forEach((id: string) => doneIds.add(id));
    });

    return {
        selectedMission: mission,
        selectedCharIds:
            mission.type === 'assigned' && mission.assignedCharacterId ? [mission.assignedCharacterId] : ([] as string[]),
        completedCharIds: Array.from(doneIds),
        isLoadingLogs: false
    };
}

export function toggleMissionCharacterAction(
    selectedMission: Mission | null,
    selectedCharIds: string[],
    completedCharIds: string[],
    id: string
) {
    if (completedCharIds.includes(id)) return selectedCharIds;

    if (selectedCharIds.includes(id)) {
        return selectedCharIds.filter((selectedId) => selectedId !== id);
    }

    if (selectedMission?.type === 'solo') {
        return [id];
    }

    if (selectedMission?.type === 'assigned') {
        return selectedMission.assignedCharacterId === id ? [id] : selectedCharIds;
    }

    return [...selectedCharIds, id];
}

export async function completeMissionAction(
    guildId: string,
    selectedMission: Mission | null,
    selectedCharIds: string[],
    characters: GuildCharacter[],
    guild: Guild | null
) {
    if (!selectedMission || selectedCharIds.length === 0) return null;
    if (!guild) {
        notify('길드 정보를 불러오지 못했습니다.');
        return null;
    }

    const targets = characters
        .filter((character) => selectedCharIds.includes(character.id!))
        .map((character) => ({ id: character.id!, name: character.name }));

    if ((selectedMission.type === 'solo' || selectedMission.type === 'assigned') && targets.length > 1) {
        notify('🚫 개인(Solo) 미션은 한 번에 한 명만 수행할 수 있습니다.');
        return null;
    }

    if (
        selectedMission.type === 'assigned' &&
        selectedMission.assignedCharacterId &&
        targets.some((target) => target.id !== selectedMission.assignedCharacterId)
    ) {
        notify('🚫 배정된 멤버만 이 미션을 수행할 수 있습니다.');
        return null;
    }

    if (selectedMission.type === 'party' && targets.length > selectedMission.maxParticipants) {
        notify(`🚫 파티 최대 인원(${selectedMission.maxParticipants}명)을 초과했습니다.`);
        return null;
    }

    const confirmMsg =
        selectedMission.type === 'solo' || selectedMission.type === 'assigned'
            ? `[${targets[0].name}] 캐릭터에게 ${selectedMission.cost}골드를 지급하시겠습니까?`
            : `${targets.length}명에게 각각 ${selectedMission.cost}골드를 지급하시겠습니까?`;

    if (!confirmAction(confirmMsg)) {
        return null;
    }

    const result = await missionStore.completeMission(guildId, selectedMission, targets, guild);

    if (result?.isChestFound && result.rewardChest) {
        return {
            selectedMission: null,
            selectedCharIds: [],
            showChestModal: true,
            rewardChest: result.rewardChest
        };
    }

    notify('✅ 미션 완료! 보상이 지급되었습니다.');

    return {
        selectedMission: null,
        selectedCharIds: [],
        showChestModal: false,
        rewardChest: null as RewardChestResult | null
    };
}
