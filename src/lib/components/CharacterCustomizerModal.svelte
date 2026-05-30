<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Palette, Save } from 'lucide-svelte';
  import CharacterAvatar from './CharacterAvatar.svelte';
  import ModalBase from './ModalBase.svelte';
  import {
    CHARACTER_AURAS,
    CHARACTER_BACKDROPS,
    CHARACTER_FRAMES,
    CHARACTER_PORTRAITS,
    resolveCharacterAppearance,
    sanitizeCharacterAppearance
  } from '$lib/stores/guild/appearance';
  import { guildStore, type CharacterAppearance, type GuildCharacter } from '$lib/stores/guildStore';
  import { notify, notifyError } from '$lib';

  export let guildId: string;
  export let character: GuildCharacter;

  const dispatch = createEventDispatcher<{
    close: void;
    saved: { characterId: string; appearance: CharacterAppearance };
  }>();

  const portraitLabels = {
    knight: '기사',
    mage: '마법사',
    healer: '힐러',
    ranger: '레인저',
    rogue: '로그',
    tank: '탱커'
  };

  const frameLabels = {
    plain: '기본',
    bronze: '청동',
    silver: '은빛',
    gold: '금빛',
    arcane: '비전'
  };

  const backdropLabels = {
    blueprint: '전술도',
    forest: '숲',
    citadel: '성채',
    sky: '하늘',
    void: '공허'
  };

  const auraLabels = {
    none: '없음',
    blue: '푸른',
    green: '초록',
    amber: '황금',
    rose: '붉은',
    violet: '보라'
  };

  const colorSwatches = [
    { label: 'Blue', value: '#1A73E8' },
    { label: 'Green', value: '#188038' },
    { label: 'Amber', value: '#F9AB00' },
    { label: 'Red', value: '#D93025' },
    { label: 'Violet', value: '#8E24AA' },
    { label: 'Cobalt', value: '#3F51B5' }
  ];

  let isSaving = false;
  let draft: CharacterAppearance = resolveCharacterAppearance(character);

  $: previewCharacter = {
    ...character,
    appearance: draft
  };

  function close() {
    dispatch('close');
  }

  async function save() {
    if (!character.id) return;

    const nextAppearance = sanitizeCharacterAppearance(draft, resolveCharacterAppearance(character));

    try {
      isSaving = true;
      await guildStore.updateCharacterAppearance(guildId, character.id, nextAppearance);
      notify('캐릭터 외형이 저장되었습니다.');
      dispatch('saved', { characterId: character.id, appearance: nextAppearance });
      close();
    } catch (error) {
      notifyError(error, '캐릭터 외형 저장에 실패했습니다.');
    } finally {
      isSaving = false;
    }
  }
</script>

<ModalBase
  open
  title={`${character.name} 꾸미기`}
  subtitle="초상, 프레임, 배경, 오라, 칭호를 선택합니다."
  size="xl"
  on:close={close}
>
  <div class="customizer-layout">
    <aside class="customizer-preview app-stat-card">
      <div class="app-label">Preview</div>
      <div class="mt-5 flex justify-center">
        <CharacterAvatar character={previewCharacter} size="lg" />
      </div>
      <div class="mt-5 text-center">
        <div class="text-xl font-semibold">{character.name}</div>
        <div class="mt-2 text-sm text-[var(--text-secondary)]">{draft.title || '칭호 없음'}</div>
      </div>
    </aside>

    <div class="customizer-controls">
      <section class="customizer-section">
        <div class="customizer-section-title">
          <Palette size={16} />
          초상
        </div>
        <div class="customizer-grid">
          {#each CHARACTER_PORTRAITS as portrait}
            <button
              type="button"
              class:active-choice={draft.portrait === portrait}
              class="customizer-choice"
              on:click={() => (draft.portrait = portrait)}
            >
              {portraitLabels[portrait]}
            </button>
          {/each}
        </div>
      </section>

      <section class="customizer-section">
        <div class="customizer-section-title">프레임</div>
        <div class="customizer-grid">
          {#each CHARACTER_FRAMES as frame}
            <button
              type="button"
              class:active-choice={draft.frame === frame}
              class="customizer-choice"
              on:click={() => (draft.frame = frame)}
            >
              {frameLabels[frame]}
            </button>
          {/each}
        </div>
      </section>

      <section class="customizer-section">
        <div class="customizer-section-title">배경</div>
        <div class="customizer-grid">
          {#each CHARACTER_BACKDROPS as backdrop}
            <button
              type="button"
              class:active-choice={draft.backdrop === backdrop}
              class="customizer-choice"
              on:click={() => (draft.backdrop = backdrop)}
            >
              {backdropLabels[backdrop]}
            </button>
          {/each}
        </div>
      </section>

      <section class="customizer-section">
        <div class="customizer-section-title">오라</div>
        <div class="customizer-grid">
          {#each CHARACTER_AURAS as aura}
            <button
              type="button"
              class:active-choice={draft.aura === aura}
              class="customizer-choice"
              on:click={() => (draft.aura = aura)}
            >
              {auraLabels[aura]}
            </button>
          {/each}
        </div>
      </section>

      <section class="customizer-section">
        <label for="character-title" class="customizer-section-title">칭호</label>
        <input
          id="character-title"
          bind:value={draft.title}
          maxlength="18"
          class="app-input"
          placeholder="예: 봉인 감시관"
        />
      </section>

      <section class="customizer-section">
        <div class="customizer-section-title">색상</div>
        <div class="swatch-row">
          {#each colorSwatches as color}
            <button
              type="button"
              class:active-swatch={draft.color === color.value}
              class="color-swatch"
              style={`--swatch: ${color.value};`}
              aria-label={color.label}
              title={color.label}
              on:click={() => (draft.color = color.value)}
            ></button>
          {/each}
        </div>
      </section>
    </div>
  </div>

  <div class="modal-action-row mt-6 flex justify-end gap-2 border-t border-[var(--grey-300)] pt-5">
    <button type="button" on:click={close} disabled={isSaving} class="app-button app-button-secondary px-4 py-3 text-sm">
      취소
    </button>
    <button type="button" on:click={save} disabled={isSaving} class="app-button app-button-primary px-4 py-3 text-sm">
      <Save size={16} />
      {isSaving ? '저장 중...' : '저장'}
    </button>
  </div>
</ModalBase>

<style>
  .customizer-layout {
    display: grid;
    gap: 1.25rem;
  }

  .customizer-preview {
    padding: 1rem;
  }

  .customizer-controls {
    display: grid;
    gap: 1rem;
  }

  .customizer-section {
    display: grid;
    gap: 0.65rem;
  }

  .customizer-section-title {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--text-primary);
    font-size: 0.9rem;
    font-weight: 600;
  }

  .customizer-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
    gap: 0.5rem;
  }

  .customizer-choice {
    min-height: 2.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--gc-divider, #dadce0);
    background: var(--gc-surface-2, #f8f9fa);
    color: var(--gc-secondary, #5f6368);
    font-weight: 600;
    transition: border-color 160ms ease, background 160ms ease, color 160ms ease, transform 160ms ease;
  }

  .customizer-choice:hover {
    border-color: var(--gc-blue, #1a73e8);
    color: var(--gc-ink, #202124);
  }

  .customizer-choice.active-choice {
    border-color: var(--gc-blue, #1a73e8);
    background: var(--gc-blue-tint, #e8f0fe);
    color: var(--gc-blue, #1a73e8);
  }

  .swatch-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
  }

  .color-swatch {
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 999px;
    border: 2px solid #fff;
    background: var(--swatch);
    box-shadow: 0 0 0 1px var(--gc-divider, #dadce0);
  }

  .color-swatch.active-swatch {
    box-shadow: 0 0 0 3px var(--gc-blue-tint, #e8f0fe), 0 0 0 5px var(--gc-blue, #1a73e8);
  }

  @media (min-width: 760px) {
    .customizer-layout {
      grid-template-columns: 16rem minmax(0, 1fr);
      align-items: start;
    }

    .customizer-preview {
      position: sticky;
      top: 1rem;
    }
  }
</style>
