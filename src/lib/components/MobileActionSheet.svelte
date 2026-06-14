<script module lang="ts">
	export type MobileActionSheetAction = {
		id: string;
		label: string;
		disabled?: boolean;
		tone?: 'default' | 'danger';
	};

	export type MobileActionSheetSelectDetail = {
		id: string;
	};
</script>

<script lang="ts">
	import { createEventDispatcher, onDestroy } from 'svelte';
	import { X } from 'lucide-svelte';
	import { lockBodyScroll } from '$lib';

	export let open = false;
	export let title = '';
	export let subtitle: string | undefined = undefined;
	export let actions: MobileActionSheetAction[] = [];

	const dispatch = createEventDispatcher<{
		select: MobileActionSheetSelectDetail;
		close: void;
	}>();

	let releaseBodyScrollLock: (() => void) | null = null;

	$: {
		if (open && !releaseBodyScrollLock) {
			releaseBodyScrollLock = lockBodyScroll();
		} else if (!open && releaseBodyScrollLock) {
			releaseBodyScrollLock();
			releaseBodyScrollLock = null;
		}
	}

	function close() {
		dispatch('close');
	}

	function selectAction(action: MobileActionSheetAction) {
		if (action.disabled) return;
		dispatch('select', { id: action.id });
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			close();
		}
	}

	onDestroy(() => {
		releaseBodyScrollLock?.();
	});
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
	<div class="mobile-action-sheet-root" role="presentation">
		<button
			type="button"
			class="mobile-action-sheet-backdrop"
			aria-label="액션 메뉴 닫기"
			on:click={close}
		></button>

		<div
			class="mobile-action-sheet"
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
		>
			<header class="mobile-action-sheet-header">
				<div class="min-w-0">
					<div class="app-label">Quick Actions</div>
					<h3>{title}</h3>
					{#if subtitle}
						<p>{subtitle}</p>
					{/if}
				</div>

				<button type="button" class="app-icon-btn" aria-label="닫기" on:click={close}>
					<X size={18} />
				</button>
			</header>

			<div class="mobile-action-sheet-list">
				{#each actions as action (action.id)}
					<button
						type="button"
						class:danger={action.tone === 'danger'}
						disabled={action.disabled}
						on:click={() => selectAction(action)}
					>
						{action.label}
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
