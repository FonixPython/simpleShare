import { ref } from "vue";

export function useAdmin() {
  const users = ref([]);
  const allFiles = ref([]);
  const allLinks = ref([]);
  const globalStorage = ref({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    totalStorageFormatted: "0 B",
  });
  const loading = ref(false);
  const error = ref("");

  const formatUsedStorage = (bytes) => {
    if (bytes === 0 || bytes === null || bytes === undefined) return "0 B";
    const units = ["B", "kB", "MB", "GB", "TB"];
    const threshold = 1024;
    let unitIndex = 0;
    let size = Number(bytes);

    while (size >= threshold && unitIndex < units.length - 1) {
      size /= threshold;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0 || bytes === null || bytes === undefined)
      return "Unlimited";
    const units = ["B", "kB", "MB", "GB", "TB"];
    const threshold = 1024;
    let unitIndex = 0;
    let size = Number(bytes);

    while (size >= threshold && unitIndex < units.length - 1) {
      size /= threshold;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const verifyAdminAccess = async (token) => {
    try {
      const response = await fetch("/verifySession", {
        method: "GET",
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      if (data.permission !== "admin") {
        throw new Error("Not an admin");
      }

      return true;
    } catch (error) {
      console.error("Admin verification failed:", error);
      return false;
    }
  };

  const loadUsers = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getAllUsersWithFiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load users");
      }

      const data = await response.json();
      users.value = data.map((user) => {
        // Calculate used storage from user's files
        const usedStorage = user.files.reduce(
          (total, file) => total + (file.size || 0),
          0,
        );

        return {
          ...user,
          quotaFormatted: formatBytes(user.quota),
          usedFormatted: formatUsedStorage(usedStorage),
          files: user.files.map((file) => ({
            ...file,
            sizeFormatted: formatBytes(file.size),
            dateFormatted:
              new Date(file.date).toLocaleDateString("hu-HU", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit",
              }) +
              " " +
              new Date(file.date).toLocaleTimeString("hu-HU", {
                hour: "2-digit",
                minute: "2-digit",
              }),
          })),
        };
      });
    } catch (error) {
      error.value = error.message;
    } finally {
      loading.value = false;
    }
  };

  const loadAllFiles = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getAllFiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load files");
      }

      const data = await response.json();
      allFiles.value = data.map((file) => ({
        ...file,
        sizeFormatted: formatBytes(file.size),
        dateFormatted:
          new Date(file.date).toLocaleDateString("hu-HU", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }) +
          " " +
          new Date(file.date).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        type: file.type || "file", // Default to 'file' if not specified
      }));
    } catch (error) {
      error.value = error.message;
    } finally {
      loading.value = false;
    }
  };

  const loadGlobalStorage = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getGlobalStorage", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load global storage");
      }

      const data = await response.json();
      globalStorage.value = {
        totalUsers: Number(data.totalUsers) || 0,
        totalFiles: Number(data.totalFiles) || 0,
        totalStorage: Number(data.totalStorage) || 0,
        totalStorageFormatted: formatBytes(Number(data.totalStorage) || 0),
        limit: Number(data.limit) || 0,
        used: Number(data.used) || 0,
        remaining: data.remaining,
        percentage: Number(data.percentage) || 0,
      };
    } catch (error) {
      error.value = error.message;
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async (token, userId) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/user/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const deleteFile = async (token, fileCode) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch(`/admin/deleteFile/${fileCode}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const getStorageSettings = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getStorageSettings", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load storage settings");
      }

      const data = await response.json();
      return {
        globalStorageLimit: data.globalStorageLimit || 0,
        totalStorageUsed: data.totalStorageUsed || 0,
        totalUsers: data.totalUsers || 0,
        totalFiles: data.totalFiles || 0,
        remainingStorage: data.remainingStorage,
        usagePercentage: data.usagePercentage || 0,
      };
    } catch (error) {
      error.value = error.message;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateStorageLimit = async (token, newLimit) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/updateStorageLimit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ limit: newLimit }),
      });

      if (!response.ok) {
        throw new Error("Failed to update storage limit");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const changeUserPassword = async (token, userId, newPassword) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/user/changePassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ userId, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const changeUsername = async (token, userId, newUsername) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/user/changeUsername", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ userId, newUsername }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change username");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const changeUserQuota = async (token, userId, newQuota) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/user/changeQuota", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ userId, newQuota }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change quota");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const changeUserAdminStatus = async (token, userId, isAdmin) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/user/changeAdminStatus", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ userId, isAdmin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change admin status");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const getGroupDetails = async (token, groupCode) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch(`/admin/getGroupDetails/${groupCode}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load group details");
      }

      const data = await response.json();
      return {
        ...data,
        files: data.files
          ? data.files.map((file) => ({
              ...file,
              sizeFormatted: formatBytes(file.size),
              dateFormatted:
                new Date(file.date).toLocaleDateString("hu-HU", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                }) +
                " " +
                new Date(file.date).toLocaleTimeString("hu-HU", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
            }))
          : [],
        sizeFormatted: formatBytes(
          data.files
            ? data.files.reduce((total, file) => total + (file.size || 0), 0)
            : 0,
        ),
        dateFormatted:
          new Date(data.date).toLocaleDateString("hu-HU", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }) +
          " " +
          new Date(data.date).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
      };
    } catch (error) {
      error.value = error.message;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const getUserStatistics = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getUserStatistics", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load user statistics");
      }

      const data = await response.json();
      return {
        userTrends: data.userTrends || [],
        adminDistribution: data.adminDistribution || {
          admin_count: 0,
          regular_count: 0,
        },
        topUsersByQuota: data.topUsersByQuota || [],
      };
    } catch (error) {
      error.value = error.message;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const getFileTypeStatistics = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getFileTypeStatistics", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load file type statistics");
      }

      const data = await response.json();
      return {
        fileTypeDistribution: data.fileTypeDistribution || [],
        uploadTrends: data.uploadTrends || [],
      };
    } catch (error) {
      error.value = error.message;
      return null;
    } finally {
      loading.value = false;
    }
  };

  const getSystemHealthMetrics = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/getSystemHealthMetrics", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load system health metrics");
      }

      const data = await response.json();
      return {
        quotaUsage: data.quotaUsage || {
          total_users: 0,
          total_allocated_quota: 0,
          total_used_storage: 0,
          total_files: 0,
          total_groups: 0,
        },
        usersOverQuota: data.usersOverQuota || [],
        largestFiles: data.largestFiles || [],
      };
    } catch (error) {
      error.value = error.message;
      return null;
    } finally {
      loading.value = false;
    }
  };

  // File management functions
  const updateFileId = async (token, currentId, newId) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/file/updateId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ currentId, newId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update file ID");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const updateFileName = async (token, fileId, newName) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/file/updateName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ fileId, newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update file name");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  // Group management functions
  const updateGroupId = async (token, currentId, newId) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/group/updateId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ currentId, newId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update group ID");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const updateGroupName = async (token, groupId, newName) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/group/updateName", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ groupId, newName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update group name");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  // Link management functions
  const updateLinkId = async (token, currentId, newId) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/link/updateId", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ currentId, newId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update link ID");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const updateLinkUrl = async (token, linkId, newUrl) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/link/updateUrl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ linkId, newUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update link URL");
      }

      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  const loadAllLinks = async (token) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch("/admin/all-links", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load links");
      }

      const data = await response.json();
      allLinks.value = data.map((link) => ({
        ...link,
        dateFormatted:
          new Date(link.created_at).toLocaleDateString("hu-HU", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          }) +
          " " +
          new Date(link.created_at).toLocaleTimeString("hu-HU", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        username: link.users?.username || "Unknown",
      }));
    } catch (error) {
      error.value = error.message;
    } finally {
      loading.value = false;
    }
  };

  const deleteLink = async (token, linkId) => {
    loading.value = true;
    error.value = "";

    try {
      const response = await fetch(`/share-link/${linkId}`, {
        method: "DELETE",
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete link");
      }

      return { success: true };
    } catch (error) {
      error.value = error.message;
      return { success: false, error: error.message };
    } finally {
      loading.value = false;
    }
  };

  return {
    users,
    allFiles,
    allLinks,
    globalStorage,
    loading,
    error,
    formatBytes,
    verifyAdminAccess,
    loadUsers,
    loadAllFiles,
    loadAllLinks,
    loadGlobalStorage,
    deleteUser,
    deleteFile,
    deleteLink,
    getStorageSettings,
    updateStorageLimit,
    changeUserPassword,
    changeUsername,
    changeUserQuota,
    changeUserAdminStatus,
    getGroupDetails,
    getUserStatistics,
    getFileTypeStatistics,
    getSystemHealthMetrics,
    updateFileId,
    updateFileName,
    updateGroupId,
    updateGroupName,
    updateLinkId,
    updateLinkUrl,
  };
}
