<script setup lang="ts">
import ConfirmModal from './presentation/components/common/ConfirmModal.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 overflow-x-clip">
    <router-view />
    <ConfirmModal />
  </div>
</template>
