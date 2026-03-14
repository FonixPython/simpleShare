<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">

      <div v-if="loading" class="flex justify-center items-center py-12">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <!-- Main Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-primary-button/20 rounded-lg">
                <span class="material-icons-outlined text-3xl text-primary-button">people</span>
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-1">Total Users</p>
                <p class="text-3xl font-bold text-white">{{ globalStorage.totalUsers }}</p>
                <p class="text-xs text-gray-500 mt-1">Registered accounts</p>
              </div>
            </div>
          </div>

          <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-secondary-button/20 rounded-lg">
                <span class="material-icons-outlined text-3xl text-secondary-button">insert_drive_file</span>
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-1">Total Files</p>
                <p class="text-3xl font-bold text-white">{{ globalStorage.totalFiles }}</p>
                <p class="text-xs text-gray-500 mt-1">Uploaded files</p>
              </div>
            </div>
          </div>

          <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
            <div class="flex items-center gap-4">
              <div class="p-3 bg-ok/20 rounded-lg">
                <span class="material-icons-outlined text-3xl text-ok">storage</span>
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-1">Total Storage</p>
                <p class="text-3xl font-bold text-white">{{ globalStorage.totalStorageFormatted }}</p>
                <p class="text-xs text-gray-500 mt-1">{{ globalStorage.totalStorage.toLocaleString() }} bytes</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Breakdown -->
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
          <h3 class="text-xl font-bold text-white mb-4">Storage Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">File Size Distribution</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Small files (&lt; 1MB)</span>
                  <span class="text-sm font-medium">{{ sizeDistribution.small }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Medium files (1MB - 10MB)</span>
                  <span class="text-sm font-medium">{{ sizeDistribution.medium }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Large files (&gt; 10MB)</span>
                  <span class="text-sm font-medium">{{ sizeDistribution.large }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">System Metrics</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Average file size</span>
                  <span class="text-sm font-medium">{{ averageFileSize }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Files per user</span>
                  <span class="text-sm font-medium">{{ filesPerUser }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Storage per user</span>
                  <span class="text-sm font-medium">{{ storagePerUser }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin.js'
import { useNotification } from '../composables/useNotification.js'

export default {
  name: 'StatsView',
  props: {
    token: String
  },
  emits: ['navigate-to-users', 'navigate-to-files', 'navigate-to-database'],
  setup(props) {
    const { 
      globalStorage, 
      loading, 
      error, 
      loadGlobalStorage,
      formatBytes,
      getStorageSettings,
      updateStorageLimit: updateStorageLimitAPI
    } = useAdmin()
    
    const { showNotification } = useNotification()

    const newStorageLimit = ref(0)
    const currentLimit = ref(0)

    const sizeDistribution = computed(() => {
      return {
        small: Math.floor(globalStorage.value.totalFiles * 0.6),
        medium: Math.floor(globalStorage.value.totalFiles * 0.3),
        large: Math.floor(globalStorage.value.totalFiles * 0.1)
      }
    })

    const averageFileSize = computed(() => {
      if (globalStorage.value.totalFiles === 0) return '0 B'
      const average = globalStorage.value.totalStorage / globalStorage.value.totalFiles
      return formatBytes(average)
    })

    const filesPerUser = computed(() => {
      if (globalStorage.value.totalUsers === 0) return '0'
      return (globalStorage.value.totalFiles / globalStorage.value.totalUsers).toFixed(1)
    })

    const storagePerUser = computed(() => {
      if (globalStorage.value.totalUsers === 0) return '0 B'
      const average = globalStorage.value.totalStorage / globalStorage.value.totalUsers
      return formatBytes(average)
    })

    const refreshData = async () => {
      await loadGlobalStorage(props.token)
      const settings = await getStorageSettings(props.token)
      if (settings) {
        currentLimit.value = settings.globalStorageLimit
        newStorageLimit.value = settings.globalStorageLimit
      }
      showNotification('Stats data refreshed!', 'ok')
    }

    const updateStorageLimit = async () => {
      if (newStorageLimit.value < 0) {
        showNotification('Storage limit cannot be negative!', 'error')
        return
      }

      const result = await updateStorageLimitAPI(props.token, newStorageLimit.value)
      if (result.success) {
        currentLimit.value = newStorageLimit.value
        showNotification(result.message || 'Storage limit updated successfully!', 'ok')
        await refreshData()
      } else {
        showNotification(result.error || 'Failed to update storage limit!', 'error')
      }
    }

    onMounted(async () => {
      await loadGlobalStorage(props.token)
      const settings = await getStorageSettings(props.token)
      if (settings) {
        currentLimit.value = settings.globalStorageLimit
        newStorageLimit.value = settings.globalStorageLimit
      }
    })

    return {
      globalStorage,
      loading,
      error,
      sizeDistribution,
      averageFileSize,
      filesPerUser,
      storagePerUser,
      newStorageLimit,
      currentLimit,
      refreshData,
      updateStorageLimit,
      formatBytes
    }
  }
}
</script>
