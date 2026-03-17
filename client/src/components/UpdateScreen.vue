<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
  >
    <div class="text-center space-y-8 max-w-md mx-auto px-6">
      <!-- Loading Spinner -->
      <div class="flex justify-center">
        <div
          class="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-blue-500"
        ></div>
      </div>

      <!-- Main Message -->
      <div class="space-y-4">
        <h1 class="text-3xl font-bold text-white">System Update in Progress</h1>
        <p class="text-gray-300 text-lg">
          The server is currently updating. Please wait...
        </p>
      </div>

      <!-- Info -->
      <div class="space-y-2">
        <p class="text-sm text-gray-400">This may take a few minutes</p>
      </div>

      <!-- Auto-refresh Info -->
      <div class="text-sm text-gray-500">
        <p>Page will automatically refresh when update is complete</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "UpdateScreen",
};
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
