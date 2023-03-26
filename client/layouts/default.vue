<template>
  <div class="w-screen h-screen">
    <slot v-if="isInitialized"></slot>
  </div>
</template>

<script setup lang="ts">
  import { useAuth } from '../composable/firebaseAuth.client';

  const { checkAuthState, token } = useAuth();
  const route = useRoute();

  const isInitialized = ref(false);

  console.log(route.path);
  
  onBeforeMount(async () => {
    await checkAuthState()
    if (route.path !== '/login' && !token.value) {
      // replaceで遷移
      await navigateTo('/login', { replace: true })
    }
    isInitialized.value = true;
  })
</script>

<style>


</style>