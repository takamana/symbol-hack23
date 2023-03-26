<template>
  <div class="flex flex-col w-screen h-screen items-center justify-center">
    <div class="w-[375px] p-4 flex flex-col justify-center">
      <span class="text-4xl text-center">メッセージ認証</span>
      <div class="flex flex-col items-center text-xl mt-6">
        <div class="w-full mb-6">
          <label for="address" class="text-sm text-gray-500">メインネットアドレスを入力</label>
          <div class="flex">
            <input placeholder="N..." if="address" class=" rounded-lg border grow border-gray-500 py-3 px-4" type="text" v-model="input.address" />
            <button :class="{'pointer-events-none': waitTime > 0}" @change="result.address = undefined" @click="onSendCode" class="ml-2 text-xl bg-blue-400/20 py-3 px-4 shrink-0 rounded-full">{{ sendButtonText }}</button>
          </div>
        </div>
        <span v-if="addressError" class="text-red-500 text-sm mb-2">{{ addressError }}</span>
        <div v-if="result.address" class="flex flex-col items-center justify-center mb-2">
          <span class="text-sm">コードが送信されました。有効期限は10分です。</span>
        </div>
      </div>
      <div v-if="result.address" class="flex flex-col items-center text-xl mt-4">
        <div class="w-full mb-6">
          <label for="code" class="text-sm text-gray-500">認証コードを入力</label>
          <div class="flex">
            <input placeholder="000000" if="code" class=" rounded-lg border grow border-gray-500 py-3 px-4" type="text" v-model="input.code" />
            <button @click="onCheckCode" class="ml-2 text-xl bg-blue-400/20 py-3 px-4 shrink-0 rounded-full">認証</button>
          </div>
        </div>
        <div v-if="codeError" class="text-red-500 text-sm mb-2 whitespace-pre flex justify-center text-center">{{ codeError }}</div>
      </div>
    </div>
    <div v-if="isLoading" class="fixed inset-0 flex items-center justify-center bg-black/5">
      <img src="~/assets/public/images/loading.gif" width="66" height="66" />
    </div>
  </div>
</template>


<script lang="ts" setup>

import { ref, Ref, computed } from 'vue';
import { checkCode, sendMessage } from '../composable/firebaseFunctions';
import { useAuth } from '../composable/firebaseAuth.client';

const { signIn } = useAuth();

const input = ref({
  address: '',
  code: ''
});

const result: Ref<{address: boolean | undefined; code: {result: boolean; customToken?: string} | undefined}> = ref({
  address: undefined,
  code: undefined
});

const addressError = computed(() => {
  if (result.value.address === false) return 'コードの送信に失敗しました。';
  return null;
});

const codeError = computed(() => {
  if (result.value.code !== undefined && result.value.code.result === false) return '認証に失敗しました。\nコードが違うか、有効期限が切れています。';
  return null;
});

const isLoading = ref(false);

const waitTime = ref(0);
const sendButtonText = computed(() => {
  if (waitTime.value <= 0) return '送信';
  return `${waitTime.value}s`;
})

const waitStart = () => {
  if (waitTime.value <= 0) return;
  waitTime.value--;
  setTimeout(waitStart, 1000);
}

const onSendCode = async () => {
  if (!input.value.address || waitTime.value > 0) return;
  const value = input.value.address.trim();
  console.log(value);
  isLoading.value = true;
  try {
    result.value.address = undefined;
    result.value.address = await sendMessage(value);
    if (result.value.address) {
      waitTime.value += 60;
      waitStart();
    }
  } finally {
    isLoading.value = false;
  }
}

const onCheckCode = async () => {
  if (!input.value.address || !input.value.code) return;
  const address = input.value.address.trim();
  const code = input.value.code.trim();
  isLoading.value = true;
  try {
    result.value.code = await checkCode(address, code);
    if (!result.value.code.result) return;
    const length = address.length;
    localStorage.setItem('_sa', `${address.substring(0, 8)}...${address.substring(length-4)}`)
    await signIn(result.value.code.customToken!);
    navigateTo('/');
  } finally {
    isLoading.value = false;
  }
}

</script>
