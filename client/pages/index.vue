<template>
  <div class="flex flex-col h-full w-full p-6">
    <div class="grid grid-cols-3">
      <div></div>
      <div class="flex justify-center text-3xl">{{ address }}</div>
      <div class="flex justify-end relative">
        <button @click="onLogout" class="absolute break-keep top-0 shrink-0 right-0 border py-3 px-4 bg-gray-200 rounded-full">ログアウト</button>
      </div>
    </div>
    <div class="w-full mt-6">
      <div>
        <span class="text-xl font-bold">COMSA</span>
        <div class="flex justify-center">
          <div class="flex gap-2 place-content-center flex-wrap">
            <span v-for="src of thumbnailList"><img :src="src" class=" max-h-[128px] max-w-[128px] sm:max-h-[256px] sm:max-w-[256px]" /></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
  import { onMounted } from 'vue'
  import { useAuth } from '~/composable/firebaseAuth.client';
  import { getThumbnailList } from '~/composable/firebaseFunctions';

  const { logout } = useAuth();

  const address = localStorage.getItem('_sa');

  const thumbnailList: Ref<string[]> = ref([]);

  const onLogout = async () => {
    await logout();
    navigateTo('/login')
  }

  onMounted(async () => {
    console.log('onMounted');
    thumbnailList.value = await getThumbnailList();
  })
</script>
