<template>
  <div class="w-full h-full pt-[120px] mobile:pt-[100px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div v-if="loading" class="flex justify-center items-center py-12">
        <span
          class="material-icons-outlined animate-spin-slow text-4xl text-primary-button"
          >hourglass_empty</span
        >
      </div>

      <div
        v-else-if="error"
        class="bg-error/20 border border-error rounded-lg p-4 text-error text-center"
      >
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <!-- Main Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
          >
            <div class="flex items-center gap-4">
              <div class="p-3 bg-primary-button/20 rounded-lg">
                <span
                  class="material-icons-outlined text-3xl text-primary-button"
                  >people</span
                >
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-1">Total Users</p>
                <p class="text-3xl font-bold text-white">
                  {{ globalStorage.totalUsers }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Registered accounts</p>
              </div>
            </div>
          </div>

          <div
            class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
          >
            <div class="flex items-center gap-4">
              <div class="p-3 bg-secondary-button/20 rounded-lg">
                <span
                  class="material-icons-outlined text-3xl text-secondary-button"
                  >insert_drive_file</span
                >
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-1">Total Files</p>
                <p class="text-3xl font-bold text-white">
                  {{ globalStorage.totalFiles }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Uploaded files</p>
              </div>
            </div>
          </div>

          <div
            class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
          >
            <div class="flex items-center gap-4">
              <div class="p-3 bg-ok/20 rounded-lg">
                <span class="material-icons-outlined text-3xl text-ok"
                  >storage</span
                >
              </div>
              <div>
                <p class="text-sm text-gray-400 mb-1">Total Storage</p>
                <p class="text-3xl font-bold text-white">
                  {{ globalStorage.totalStorageFormatted }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  {{ globalStorage.totalStorage.toLocaleString() }} bytes
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Breakdown -->
        <div
          class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
        >
          <h3 class="text-xl font-bold text-white mb-4">Storage Analysis</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                File Size Distribution
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400"
                    >Small files (&lt; 10MB)</span
                  >
                  <span class="text-sm font-medium">{{
                    sizeDistribution.small
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400"
                    >Medium files (10MB - 100MB)</span
                  >
                  <span class="text-sm font-medium">{{
                    sizeDistribution.medium
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400"
                    >Large files (&gt; 100MB)</span
                  >
                  <span class="text-sm font-medium">{{
                    sizeDistribution.large
                  }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                System Metrics
              </h4>
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

        <!-- User Statistics -->
        <div
          class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
        >
          <h3 class="text-xl font-bold text-white mb-4">User Activity</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                User Distribution
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Admin users</span>
                  <span class="text-sm font-medium">{{
                    userStats.adminDistribution.admin_count
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Regular users</span>
                  <span class="text-sm font-medium">{{
                    userStats.adminDistribution.regular_count
                  }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                User Registration Trends (Last 3 Months)
              </h4>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <div
                  v-for="trend in userStats.userTrends.slice(-3).reverse()"
                  :key="trend.month"
                  class="flex justify-between items-center"
                >
                  <span class="text-sm text-gray-400">{{
                    formatMonth(trend.month)
                  }}</span>
                  <span class="text-sm font-medium"
                    >{{ trend.new_users }} users</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- File Type Distribution -->
        <div
          class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
        >
          <h3 class="text-xl font-bold text-white mb-4">
            File Type Distribution
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                Files by Category
              </h4>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div
                  v-for="type in fileTypeStats.fileTypeDistribution"
                  :key="type.file_category"
                  class="flex justify-between items-center"
                >
                  <span class="text-sm text-gray-400">{{
                    type.file_category
                  }}</span>
                  <div class="text-right">
                    <span class="text-sm font-medium"
                      >{{ type.file_count }} files</span
                    >
                    <span class="text-xs text-gray-500 ml-2">{{
                      formatBytes(type.total_size)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                Recent Upload Activity (Last 7 Days)
              </h4>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div
                  v-for="trend in uploadTrends.slice(-7).reverse()"
                  :key="trend.upload_date"
                  class="flex justify-between items-center"
                >
                  <span class="text-sm text-gray-400">{{
                    formatDate(trend.upload_date)
                  }}</span>
                  <div class="text-right">
                    <span class="text-sm font-medium"
                      >{{ trend.files_uploaded }} files</span
                    >
                    <span class="text-xs text-gray-500 ml-2">{{
                      formatBytes(trend.total_size_uploaded)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- System Health -->
        <div
          class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
        >
          <h3 class="text-xl font-bold text-white mb-4">System Health</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                Storage Overview
              </h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400"
                    >Total allocated quota</span
                  >
                  <span class="text-sm font-medium">{{
                    formatBytes(systemHealth.quotaUsage.total_allocated_quota)
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Total used storage</span>
                  <span class="text-sm font-medium">{{
                    formatBytes(systemHealth.quotaUsage.total_used_storage)
                  }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Total groups</span>
                  <span class="text-sm font-medium">{{
                    systemHealth.quotaUsage.total_groups
                  }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">
                Users Near Quota Limit (&gt;90%)
              </h4>
              <div class="space-y-2 max-h-32 overflow-y-auto">
                <div
                  v-if="systemHealth.usersOverQuota.length === 0"
                  class="text-sm text-gray-500"
                >
                  No users approaching quota limit
                </div>
                <div
                  v-for="user in systemHealth.usersOverQuota"
                  :key="user.username"
                  class="flex justify-between items-center"
                >
                  <span class="text-sm text-gray-400">{{ user.username }}</span>
                  <span
                    class="text-sm font-medium"
                    :class="
                      user.usage_percentage >= 100
                        ? 'text-error'
                        : 'text-warning'
                    "
                  >
                    {{ user.usage_percentage.toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Users by Storage -->
        <div
          class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
        >
          <h3 class="text-xl font-bold text-white mb-4">
            Top Users by Storage Usage
          </h3>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="user in topUsersByStorage"
              :key="user.username"
              class="flex justify-between items-center p-2 border border-[#333] rounded"
            >
              <div>
                <span class="text-sm font-medium text-white">{{
                  user.username
                }}</span>
                <span class="text-xs text-gray-400 ml-2"
                  >{{ formatBytes(user.used_storage) }} /
                  {{ formatBytes(user.quota_in_bytes) }}</span
                >
              </div>
              <div class="text-right">
                <div class="w-24 bg-[#333] rounded-full h-2">
                  <div
                    class="bg-primary-button h-2 rounded-full"
                    :style="{
                      width:
                        Math.min(
                          (user.used_storage / user.quota_in_bytes) * 100,
                          100,
                        ) + '%',
                    }"
                  ></div>
                </div>
                <span class="text-xs text-gray-400"
                  >{{
                    ((user.used_storage / user.quota_in_bytes) * 100).toFixed(
                      1,
                    )
                  }}%</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- Largest Files -->
        <div
          class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6"
        >
          <h3 class="text-xl font-bold text-white mb-4">Largest Files</h3>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="file in systemHealth.largestFiles"
              :key="file.code"
              class="flex justify-between items-center p-2 border border-[#333] rounded"
            >
              <div class="flex-1">
                <span class="text-sm font-medium text-white truncate">{{
                  file.name
                }}</span>
                <span class="text-xs text-gray-400 ml-2">{{
                  file.username
                }}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-medium">{{
                  formatBytes(file.size)
                }}</span>
                <span class="text-xs text-gray-400 block">{{
                  formatDate(file.date)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useAdmin } from "../composables/useAdmin.js";
import { useNotification } from "../composables/useNotification.js";

export default {
  name: "StatsView",
  props: {
    token: String,
  },
  emits: ["navigate-to-users", "navigate-to-files", "navigate-to-database"],
  setup(props) {
    const {
      globalStorage,
      allFiles,
      loading,
      error,
      loadGlobalStorage,
      loadAllFiles,
      formatBytes,
      getStorageSettings,
      updateStorageLimit: updateStorageLimitAPI,
      getUserStatistics,
      getFileTypeStatistics,
      getSystemHealthMetrics,
    } = useAdmin();

    const { showNotification } = useNotification();

    const newStorageLimit = ref(0);
    const currentLimit = ref(0);
    const userStats = ref({
      userTrends: [],
      adminDistribution: { admin_count: 0, regular_count: 0 },
      topUsersByQuota: [],
    });
    const fileTypeStats = ref({
      fileTypeDistribution: [],
      uploadTrends: [],
    });
    const systemHealth = ref({
      quotaUsage: {
        total_users: 0,
        total_allocated_quota: 0,
        total_used_storage: 0,
        total_files: 0,
        total_groups: 0,
      },
      usersOverQuota: [],
      largestFiles: [],
    });

    const sizeDistribution = computed(() => {
      const small = allFiles.value.filter(
        (file) => file.size < 10 * 1024 * 1024,
      ).length;
      const medium = allFiles.value.filter(
        (file) =>
          file.size >= 10 * 1024 * 1024 && file.size <= 100 * 1024 * 1024,
      ).length;
      const large = allFiles.value.filter(
        (file) => file.size > 100 * 1024 * 1024,
      ).length;

      return {
        small,
        medium,
        large,
      };
    });

    const averageFileSize = computed(() => {
      if (globalStorage.value.totalFiles === 0) return "0 B";
      const average =
        globalStorage.value.totalStorage / globalStorage.value.totalFiles;
      return formatBytes(average);
    });

    const filesPerUser = computed(() => {
      if (globalStorage.value.totalUsers === 0) return "0";
      return (
        globalStorage.value.totalFiles / globalStorage.value.totalUsers
      ).toFixed(1);
    });

    const storagePerUser = computed(() => {
      if (globalStorage.value.totalUsers === 0) return "0 B";
      const average =
        globalStorage.value.totalStorage / globalStorage.value.totalUsers;
      return formatBytes(average);
    });

    const uploadTrends = computed(() => fileTypeStats.value.uploadTrends || []);

    const topUsersByStorage = computed(() => {
      return userStats.value.topUsersByQuota
        .map((user) => ({
          ...user,
          used_storage: Number(user.used_storage || 0),
          quota_in_bytes: Number(user.quota_in_bytes || 0),
        }))
        .sort((a, b) => b.used_storage - a.used_storage)
        .slice(0, 10);
    });

    const formatMonth = (monthString) => {
      const [year, month] = monthString.split("-");
      const date = new Date(year, month - 1);
      return date.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "short",
      });
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString("hu-HU", {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      });
    };

    const refreshData = async () => {
      await Promise.all([
        loadGlobalStorage(props.token),
        loadAllFiles(props.token),
        loadAdditionalStats(),
      ]);
      const settings = await getStorageSettings(props.token);
      if (settings) {
        currentLimit.value = settings.globalStorageLimit;
        newStorageLimit.value = settings.globalStorageLimit;
      }
      showNotification("Stats data refreshed!", "ok");
    };

    const loadAdditionalStats = async () => {
      try {
        const [userStatsData, fileTypeStatsData, systemHealthData] =
          await Promise.all([
            getUserStatistics(props.token),
            getFileTypeStatistics(props.token),
            getSystemHealthMetrics(props.token),
          ]);

        if (userStatsData) userStats.value = userStatsData;
        if (fileTypeStatsData) fileTypeStats.value = fileTypeStatsData;
        if (systemHealthData) systemHealth.value = systemHealthData;
      } catch (error) {
        console.error("Failed to load additional statistics:", error);
      }
    };

    const updateStorageLimit = async () => {
      if (newStorageLimit.value < 0) {
        showNotification("Storage limit cannot be negative!", "error");
        return;
      }

      const result = await updateStorageLimitAPI(
        props.token,
        newStorageLimit.value,
      );
      if (result.success) {
        currentLimit.value = newStorageLimit.value;
        showNotification(
          result.message || "Storage limit updated successfully!",
          "ok",
        );
        await refreshData();
      } else {
        showNotification(
          result.error || "Failed to update storage limit!",
          "error",
        );
      }
    };

    onMounted(async () => {
      await Promise.all([
        loadGlobalStorage(props.token),
        loadAllFiles(props.token),
        loadAdditionalStats(),
      ]);
      const settings = await getStorageSettings(props.token);
      if (settings) {
        currentLimit.value = settings.globalStorageLimit;
        newStorageLimit.value = settings.globalStorageLimit;
      }
    });

    return {
      globalStorage,
      allFiles,
      loading,
      error,
      sizeDistribution,
      averageFileSize,
      filesPerUser,
      storagePerUser,
      newStorageLimit,
      currentLimit,
      userStats,
      fileTypeStats,
      systemHealth,
      uploadTrends,
      topUsersByStorage,
      refreshData,
      updateStorageLimit,
      formatBytes,
      formatMonth,
      formatDate,
    };
  },
};
</script>
