import { confirmAction, createCharacterForm, createShopItemForm, notify } from '$lib';
import { guildStore, type GuildCharacter } from '$lib/stores/guildStore';
import { itemStore, type ShopItem } from '$lib/stores/itemStore';

export async function createCharacterAction(guildId: string, newChar: Partial<GuildCharacter>) {
    if (!newChar.name) {
        notify('이름을 입력해주세요.');
        return { isCreating: true, newChar };
    }

    await guildStore.createCharacter(guildId, {
        ...newChar,
        currentGold: 0,
        level: 1,
        exp: 0
    } as GuildCharacter);

    notify(`🎉 [${newChar.name}] 캐릭터 생성 완료!`);

    return {
        isCreating: false,
        newChar: createCharacterForm()
    };
}

export async function updateCharacterAction(guildId: string, editingChar: GuildCharacter | null) {
    if (!editingChar?.id) return editingChar;

    await guildStore.updateCharacter(guildId, editingChar.id, {
        name: editingChar.name,
        jobClass: editingChar.jobClass,
        grade: editingChar.grade,
        description: editingChar.description
    });

    notify('수정되었습니다.');
    return null;
}

export async function deleteCharacterAction(guildId: string, char: GuildCharacter) {
    if (!confirmAction(`정말 [${char.name}] 캐릭터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }

    await guildStore.deleteCharacter(guildId, char.id!);
    notify('삭제되었습니다.');
}

export async function checkInCharacterAction(guildId: string, charId: string) {
    const result = await guildStore.checkInCharacter(guildId, charId);
    notify(`✅ 출석 완료!\n\n 연속 ${result.streak}일 출석으로 ${result.reward}G를 획득했습니다!`);
}

export async function saveShopItemAction(
    guildId: string,
    newItem: Partial<ShopItem>,
    editingItem: ShopItem | null
) {
    if (!newItem.name) {
        notify('상품명을 입력해주세요.');
        return { newItem, shouldClose: false };
    }

    if (newItem.cost === undefined || newItem.cost < 0) {
        notify('가격은 0 이상이어야 합니다.');
        return { newItem, shouldClose: false };
    }

    if (editingItem?.id) {
        await itemStore.updateItem(guildId, editingItem.id, {
            name: newItem.name,
            cost: newItem.cost,
            icon: newItem.icon,
            description: newItem.description
        });
        notify('상품이 수정되었습니다.');
    } else {
        await itemStore.addItem(guildId, {
            name: newItem.name,
            cost: newItem.cost,
            icon: newItem.icon || '🎁',
            description: newItem.description
        } as ShopItem);
        notify('새 상품이 등록되었습니다.');
    }

    return {
        newItem: createShopItemForm(),
        shouldClose: true
    };
}

export async function deleteShopItemAction(guildId: string, item: ShopItem) {
    if (!confirmAction(`🗑️ [${item.name}] 상품을 삭제하시겠습니까?`)) {
        return;
    }

    await itemStore.deleteItem(guildId, item.id!);
}

export async function purchaseShopItemAction(guildId: string, shoppingChar: GuildCharacter | null, item: ShopItem) {
    if (!shoppingChar) return;

    if (shoppingChar.currentGold < item.cost) {
        notify(`골드가 부족합니다! (현재: ${shoppingChar.currentGold} G)`);
        return;
    }

    if (!confirmAction(`[${shoppingChar.name}] 캐릭터로\n'${item.name}'을(를) 구매하시겠습니까?\n💰 ${item.cost} 골드가 차감됩니다.`)) {
        return;
    }

    await guildStore.useGold(guildId, shoppingChar.id!, item.name, item.cost);
    notify(`구매 완료! ${item.name} 획득.`);

    if (item.isOneTime && item.id) {
        await itemStore.deleteItem(guildId, item.id);
    }
}

export function openShopItemModal(item?: ShopItem) {
    if (item) {
        return {
            editingItem: item,
            newItem: { ...item },
            isItemModalOpen: true
        };
    }

    return {
        editingItem: null,
        newItem: createShopItemForm(),
        isItemModalOpen: true
    };
}

export function closeShopItemModal() {
    return {
        editingItem: null,
        isItemModalOpen: false
    };
}
