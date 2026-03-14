<template>
  <div class="w-full h-full pt-[120px] mobile:pt-[100px] overflow-hidden p-6">
    <div class="w-full max-w-[90vw] mx-auto h-full">
      <div v-if="loading" class="flex justify-center items-center h-[60vh]">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else class="h-[calc(100vh-140px)] overflow-hidden">
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 h-full">
          <!-- Storage Overview -->
          <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
            <h3 class="text-xl font-bold text-white mb-4">Storage Overview</h3>
            <div class="grid grid-cols-1 gap-6">
              <div>
                <h4 class="text-sm font-medium text-gray-300 mb-3">Current Usage</h4>
                <div class="space-y-2">
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-400">Used Storage</span>
                    <span class="text-sm font-medium">{{ globalStorage.totalStorageFormatted }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-400">Storage Limit</span>
                    <span class="text-sm font-medium">{{ formatBytes(currentLimit) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-400">Available Storage</span>
                    <span class="text-sm font-medium">{{ formatBytes(availableStorage) }}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-300 mb-3">Usage Progress</h4>
                <div class="space-y-3">
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <span class="text-sm text-gray-400">Storage Usage</span>
                      <span class="text-sm font-medium">{{ usagePercentage }}%</span>
                    </div>
                    <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                      <div 
                        class="h-full bg-gradient-to-r from-primary-button to-secondary-button rounded-full transition-all duration-700 ease-out"
                        :style="{ width: usagePercentage + '%' }">
                      </div>
                    </div>
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
                <label class="block text-sm font-semibold text-gray-300 mb-2">Global Storage Limit</label>
                <div class="flex gap-3">
                  <div class="flex-1 relative">
                    <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">sd_storage</span>
                    <input 
                      v-model="newStorageLimitValue"
                      type="number" 
                      class="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all"
                      placeholder="Enter storage limit value"
                      :disabled="newStorageLimitUnit === 'Unlimited'">
                  </div>
                  <select 
                    v-model="newStorageLimitUnit"
                    class="px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white focus:border-primary-button focus:outline-none focus:ring-2 focus:ring-primary-button/20 transition-all">
                    <option value="Unlimited">Unlimited</option>
                    <option value="B">B</option>
                    <option value="kB">kB</option>
                    <option value="MB">MB</option>
                    <option value="GB">GB</option>
                    <option value="TB">TB</option>
                  </select>
                </div>
                <div class="mt-3 flex gap-4">
                  <p class="text-xs text-gray-500">
                    Current limit: {{ formatBytes(currentLimit) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    New limit: {{ formatBytes(calculateNewLimit()) }}
                  </p>
                </div>
                <button 
                  @click="updateStorageLimit"
                  :disabled="loading"
                  class="mt-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-6 py-3 rounded-xl hover:from-yellow-600 hover:to-yellow-700 transition-all font-medium shadow-lg flex items-center gap-2 disabled:opacity-50">
                  <span 
                    :class="[
                      'material-icons text-sm',
                      loading ? 'animate-spin-slow' : ''
                    ]">save</span>
                  Update Storage Limit
                </button>
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
  name: 'GlobalStorageView',
  props: {
    token: String
  },
  emits: ['navigate-to-stats', 'navigate-to-database'],
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

    const newStorageLimitValue = ref(null)
    const newStorageLimitUnit = ref('Unlimited')
    const currentLimit = ref(0)

    const calculateNewLimit = () => {
      if (newStorageLimitUnit.value === 'Unlimited') return 0
      if (!newStorageLimitValue.value) return 0
      
      const multipliers = {
        'B': 1,
        'kB': 1024,
        'MB': 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'TB': 1024 * 1024 * 1024 * 1024
      }
      
      return newStorageLimitValue.value * (multipliers[newStorageLimitUnit.value] || 1)
    }

    const parseCurrentLimit = (limitInBytes) => {
      if (limitInBytes === 0) {
        newStorageLimitValue.value = null
        newStorageLimitUnit.value = 'Unlimited'
        return
      }
      
      // Find the largest unit that fits
      const units = ['TB', 'GB', 'MB', 'kB', 'B']
      const multipliers = {
        'TB': 1024 * 1024 * 1024 * 1024,
        'GB': 1024 * 1024 * 1024,
        'MB': 1024 * 1024,
        'kB': 1024,
        'B': 1
      }
      
      for (const unit of units) {
        if (limitInBytes >= multipliers[unit] && limitInBytes % multipliers[unit] === 0) {
          newStorageLimitValue.value = limitInBytes / multipliers[unit]
          newStorageLimitUnit.value = unit
          return
        }
      }
      
      // If no exact match, use MB with decimal
      newStorageLimitValue.value = Math.round(limitInBytes / (1024 * 1024) * 100) / 100
      newStorageLimitUnit.value = 'MB'
    }

    const availableStorage = computed(() => {
      if (currentLimit.value === 0) return 0
      return Math.max(0, currentLimit.value - globalStorage.value.totalStorage)
    })

    const usagePercentage = computed(() => {
      if (currentLimit.value === 0) return 0
      return Math.round((globalStorage.value.totalStorage / currentLimit.value) * 100)
    })

    const refreshData = async () => {
      await loadGlobalStorage(props.token)
      const settings = await getStorageSettings(props.token)
      if (settings) {
        currentLimit.value = settings.globalStorageLimit
        parseCurrentLimit(settings.globalStorageLimit)
      }
      showNotification('Storage data refreshed!', 'ok')
    }

    const updateStorageLimit = async () => {
      const newLimit = calculateNewLimit()
      
      const result = await updateStorageLimitAPI(props.token, newLimit)
      if (result.success) {
        currentLimit.value = newLimit
        showNotification(result.message || 'Storage limit updated successfully!', 'ok')
        // Refresh data silently without showing notification
        await loadGlobalStorage(props.token)
        const settings = await getStorageSettings(props.token)
        if (settings) {
          currentLimit.value = settings.globalStorageLimit
          parseCurrentLimit(settings.globalStorageLimit)
        }
      } else {
        showNotification(result.error || 'Failed to update storage limit!', 'error')
      }
    }

    onMounted(async () => {
      await loadGlobalStorage(props.token)
      const settings = await getStorageSettings(props.token)
      if (settings) {
        currentLimit.value = settings.globalStorageLimit
        parseCurrentLimit(settings.globalStorageLimit)
      }
    })

    return {
      globalStorage,
      loading,
      error,
      availableStorage,
      usagePercentage,
      newStorageLimitValue,
      newStorageLimitUnit,
      currentLimit,
      refreshData,
      updateStorageLimit,
      formatBytes,
      calculateNewLimit
    }
  }
}
</script>
