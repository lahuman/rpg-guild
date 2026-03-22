import type { Mission } from '$lib/stores/missionStore';
import type { Guild, GuildCharacter } from '$lib/stores/guildStore';
import { missionStore } from '$lib/stores/missionStore';
import { confirmAction, createMissionForm, notify } from '$lib';

export function sortMissionsAction(missions: Mission[], completedIds: Set<string>) {
    return [...missions].sort((a, b) => {
        const isDoneA = completedIds.has(a.id || '');
        const isDoneB = completedIds.has(b.id || '');
        if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;

        const oneTimeA = !!a.isOneTime;
        const oneTimeB = !!b.isOneTime;
        if (oneTimeA !== oneTimeB) return oneTimeA ? 1 : -1;

        if (a.type !== b.type) {
            return a.type === 'solo' ? -1 : 1;
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

    if (editingMissionId) {
        await missionStore.updateMission(guildId, editingMissionId, newMission);
        notify('퀘스트가 수정되었습니다.');
        return {
            shouldClose: true,
            ...resetMissionFormAction(),
            preservedMission: null as ReturnType<typeof createMissionForm> | null
        };
    }

    await missionStore.addMission(guildId, newMission);
    return {
        shouldClose: false,
        ...resetMissionFormAction(),
        preservedMission: null as ReturnType<typeof createMissionForm> | null
    };
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
        selectedCharIds: [] as string[],
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

    if (selectedMission.type === 'solo' && targets.length > 1) {
        notify('🚫 개인(Solo) 미션은 한 번에 한 명만 수행할 수 있습니다.');
        return null;
    }

    if (selectedMission.type === 'party' && targets.length > selectedMission.maxParticipants) {
        notify(`🚫 파티 최대 인원(${selectedMission.maxParticipants}명)을 초과했습니다.`);
        return null;
    }

    const confirmMsg =
        selectedMission.type === 'solo'
            ? `[${targets[0].name}] 캐릭터에게 ${selectedMission.cost}골드를 지급하시겠습니까?`
            : `${targets.length}명에게 각각 ${selectedMission.cost}골드를 지급하시겠습니까?`;

    if (!confirmAction(confirmMsg)) {
        return null;
    }

    const result = await missionStore.completeMission(guildId, selectedMission, targets, guild);

    if (result?.isChestFound) {
        return {
            selectedMission: null,
            selectedCharIds: [],
            showChestModal: true,
            chestOpened: false,
            chestBonus: result.bonusGold
        };
    }

    notify('✅ 미션 완료! 보상이 지급되었습니다.');

    return {
        selectedMission: null,
        selectedCharIds: [],
        showChestModal: false,
        chestOpened: false,
        chestBonus: 0
    };
}
