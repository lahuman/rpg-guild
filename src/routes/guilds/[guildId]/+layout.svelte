<script lang="ts">
    import { onMount } from 'svelte';
    import { userStore } from '$lib/stores/userStore';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    // 페이지가 뜰 때 로그인 체크
    onMount(() => {
        // userStore가 로딩 중이 아니고(null 체크 등), 유저가 없으면 추방
        // Firebase Auth 상태 감지 딜레이를 고려해 store의 초기화 상태를 확인하면 더 좋습니다.
        const unsubscribe = userStore.subscribe(user => {
            // 유저가 없다면 메인으로 강제 이동
            if (!user) {
                // 알림을 띄우고 싶다면 alert("로그인이 필요합니다.");
                goto('/', { replaceState: true });
            }
        });

        return () => unsubscribe();
    });
</script>

<slot />