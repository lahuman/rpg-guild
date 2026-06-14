import type {
	MobileActionSheetAction,
	MobileActionSheetSelectDetail
} from './MobileActionSheet.svelte';

const defaultAction = {
	id: 'shop',
	label: '상점'
} satisfies MobileActionSheetAction;

const dangerAction = {
	id: 'delete',
	label: '삭제',
	tone: 'danger'
} satisfies MobileActionSheetAction;

const disabledAction = {
	id: 'grade',
	label: '등급 도전',
	disabled: true
} satisfies MobileActionSheetAction;

const selectedDetail = {
	id: defaultAction.id
} satisfies MobileActionSheetSelectDetail;

export const mobileActionSheetCompileAssertions = {
	defaultAction,
	dangerAction,
	disabledAction,
	selectedDetail
};
