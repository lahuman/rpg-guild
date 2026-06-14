import { writable } from 'svelte/store';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '$lib/firebase';
import { getErrorMessage } from '$lib';
import type { MemberMissionLogInput, MemberUsageLogInput } from '$lib/features/members/report';

export interface MemberReportStoreState {
	missionLogs: MemberMissionLogInput[];
	usageLogs: MemberUsageLogInput[];
	isLoading: boolean;
	error: string;
}

const initialState: MemberReportStoreState = {
	missionLogs: [],
	usageLogs: [],
	isLoading: false,
	error: ''
};

function createMemberReportStore() {
	const { subscribe, set, update } = writable<MemberReportStoreState>(initialState);

	return {
		subscribe,

		async fetchLogs(guildId: string) {
			update((state) => ({
				...state,
				isLoading: true,
				error: ''
			}));

			try {
				const [missionSnapshot, usageSnapshot] = await Promise.all([
					getDocs(collection(db, `guilds/${guildId}/mission_logs`)),
					getDocs(collection(db, `guilds/${guildId}/usage_logs`))
				]);

				set({
					missionLogs: missionSnapshot.docs.map((missionDoc) => ({
						id: missionDoc.id,
						...missionDoc.data()
					}) as MemberMissionLogInput),
					usageLogs: usageSnapshot.docs.map((usageDoc) => ({
						id: usageDoc.id,
						...usageDoc.data()
					}) as MemberUsageLogInput),
					isLoading: false,
					error: ''
				});
			} catch (error) {
				set({
					...initialState,
					error: getErrorMessage(error, '멤버 보고서를 불러오지 못했습니다.')
				});
			}
		},

		reset() {
			set(initialState);
		}
	};
}

export const memberReportStore = createMemberReportStore();
