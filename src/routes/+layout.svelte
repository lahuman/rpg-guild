<script>
	import "../app.css"; // 수정된 app.css 불러오기
	import { userStore } from "$lib/stores/userStore";
	import { auth } from "$lib/firebase";

	function logout() {
		auth.signOut();
	}
</script>

<nav class="p-4 bg-gray-800 text-white flex justify-between">
	<a href="/" class="font-bold">My Guild App</a>

	<div>
		{#if $userStore}
			<span class="mr-4">
				👋 {$userStore.email}
				{#if $userStore.guildId}
					(길드원)
				{/if}
			</span>
			<button on:click={logout} class="bg-red-500 px-3 py-1 rounded"
				>로그아웃</button
			>
		{:else}
			<a href="/login">로그인</a>
		{/if}
	</div>
</nav>

<slot />
