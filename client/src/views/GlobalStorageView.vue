<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Global Storage Overview</h2>
        <button 
          @click="refreshData"
          :disabled="loading"
          class="bg-primary-button text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
          <span 
            :class="[
              'material-icons text-sm',
              loading ? 'animate-spin-slow' : ''
            ]">refresh</span>
          Refresh
        </button>
      </div>

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

        <!-- Storage Usage Chart -->
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
          <h3 class="text-xl font-bold text-white mb-4">Storage Usage Breakdown</h3>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-sm text-gray-400">Used Storage</span>
                <span class="text-sm font-medium">{{ globalStorage.totalStorageFormatted }}</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary-button to-secondary-button rounded-full transition-all duration-700 ease-out"
                  :style="{ width: '100%' }">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Limit Management -->
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
          <h3 class="text-xl font-bold text-white mb-4">Storage Limit Management</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Global Storage Limit (0 = Unlimited)
              </label>
              <div class="flex gap-3">
                <input 
                  v-model.number="newStorageLimit"
                  type="number"
                  min="0"
                  step="1048576"
                  class="flex-1 bg-black/40 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary-button focus:outline-none"
                  placeholder="Enter storage limit in bytes"
                />
                <button 
                  @click="updateStorageLimit"
                  :disabled="loading || newStorageLimit < 0"
                  class="bg-primary-button text-black px-6 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
                  <span 
                    :class="[
                      'material-icons text-sm',
                      loading ? 'animate-spin-slow' : ''
                    ]">save</span>
                  Update Limit
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Current limit: {{ formatBytes(currentLimit) }} | 
                New limit: {{ formatBytes(newStorageLimit) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
          <h3 class="text-xl font-bold text-white mb-4">Quick Actions</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              @click="$emit('navigate-to-users')"
              class="p-4 bg-primary-button/10 border border-primary-button/30 rounded-lg hover:bg-primary-button/20 transition-colors text-left">
              <span class="material-icons-outlined text-primary-button mb-2">people</span>
              <p class="text-sm font-medium text-white">Manage Users</p>
              <p class="text-xs text-gray-400">View and manage user accounts</p>
            </button>
            <button 
              @click="$emit('navigate-to-files')"
              class="p-4 bg-secondary-button/10 border border-secondary-button/30 rounded-lg hover:bg-secondary-button/20 transition-colors text-left">
              <span class="material-icons-outlined text-secondary-button mb-2">insert_drive_file</span>
              <p class="text-sm font-medium text-white">Manage Files</p>
              <p class="text-xs text-gray-400">View and manage uploaded files</p>
            </button>
            <button 
              @click="$emit('navigate-to-database')"
              class="p-4 bg-ok/10 border border-ok/30 rounded-lg hover:bg-ok/20 transition-colors text-left">
              <span class="material-icons-outlined text-ok mb-2">storage</span>
              <p class="text-sm font-medium text-white">Database</p>
              <p class="text-xs text-gray-400">Access database management</p>
            </button>
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
  name: 'GlobalStorageView',
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
      showNotification('Storage data refreshed!', 'ok')
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
