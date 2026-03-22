<template>
  <div
    class="absolute top-[100px] mobile:top-[80px] left-0 w-full h-[calc(100vh-100px)] mobile:h-[calc(100vh-80px)] bg-bg overflow-y-auto p-5"
  >
    <!-- Table Selector -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-3 text-white">Database Tables</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="table in tables"
          :key="table.name"
          @click="selectTable(table.name)"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
            selectedTable === table.name
              ? 'bg-primary-button text-black'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          ]"
        >
          {{ table.label }}
          <span class="text-xs opacity-70 ml-1">({{ table.name }})</span>
        </button>
      </div>
      <p v-if="selectedTableInfo" class="text-gray-400 text-sm mt-2">
        {{ selectedTableInfo.description }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-button"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-300">
      {{ error }}
    </div>

    <!-- Data Table -->
    <div v-else-if="selectedTable && tableData.length > 0" class="bg-gray-800 rounded-lg overflow-hidden">
      <!-- Table Controls -->
      <div class="p-4 bg-gray-700 flex flex-wrap gap-2 items-center justify-between">
        <div class="flex gap-2">
          <button
            @click="saveChanges"
            :disabled="!hasChanges || saving"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
          >
            <span v-if="saving">Saving...</span>
            <span v-else>Save Changes</span>
          </button>
          <button
            @click="discardChanges"
            :disabled="!hasChanges"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            Discard
          </button>
        </div>
        <div class="flex gap-2">
          <button
            @click="addNewRow"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            + Add Row
          </button>
          <button
            @click="refreshData"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      <!-- Unsaved Changes Indicator -->
      <div v-if="hasChanges" class="px-4 py-2 bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-300 text-sm">
        You have unsaved changes. Don't forget to save!
      </div>

      <!-- Table -->
      <div class="overflow-x-auto max-h-[calc(100vh-280px)]">
        <table class="w-full text-sm text-left">
          <thead class="sticky top-0 bg-gray-700 text-gray-300 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 font-semibold">Actions</th>
              <th
                v-for="column in columns"
                :key="column"
                class="px-4 py-3 font-semibold"
              >
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-700">
            <tr
              v-for="(row, index) in editedData"
              :key="getRowKey(row, index)"
              :class="[
                'hover:bg-gray-700/50 transition-colors',
                row._isNew ? 'bg-blue-500/10' : '',
                row._isDeleted ? 'opacity-50 line-through' : '',
                row._isModified ? 'bg-yellow-500/10' : ''
              ]"
            >
              <td class="px-4 py-3 whitespace-nowrap">
                <div class="flex gap-1">
                  <button
                    v-if="!row._isDeleted"
                    @click="deleteRow(index)"
                    class="p-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded transition-colors"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    v-else
                    @click="undoDelete(index)"
                    class="p-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded transition-colors"
                    title="Undo Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                </div>
              </td>
              <td
                v-for="column in columns"
                :key="column"
                class="px-4 py-3"
              >
                <input
                  v-if="!row._isDeleted && isEditable(column)"
                  v-model="row[column]"
                  @input="markModified(index)"
                  :type="getInputType(column, row[column])"
                  class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-primary-button focus:outline-none"
                  :class="{ 'border-yellow-500/50': row._isModified && !row._isNew }"
                />
                <span v-else class="text-gray-400">
                  {{ formatValue(row[column]) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Row Count -->
      <div class="p-4 bg-gray-700 text-gray-400 text-sm">
        Total rows: {{ tableData.length }}
        <span v-if="hasChanges" class="ml-4 text-yellow-400">
          ({{ newRows.length }} new, {{ modifiedRows.length }} modified, {{ deletedRows.length }} deleted)
        </span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="selectedTable && tableData.length === 0" class="text-center py-16 text-gray-400">
      <p class="text-lg">No data in this table</p>
      <button
        @click="addNewRow"
        class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
      >
        Add First Row
      </button>
    </div>

    <!-- No Table Selected -->
    <div v-else class="text-center py-16 text-gray-400">
      <p class="text-lg">Select a table to view and edit data</p>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from "vue";

export default {
  name: "DatabaseView",
  props: {
    token: String,
  },
  setup(props) {
    const tables = ref([]);
    const selectedTable = ref("");
    const columns = ref([]);
    const tableData = ref([]);
    const editedData = ref([]);
    const loading = ref(false);
    const saving = ref(false);
    const error = ref(null);

    const selectedTableInfo = computed(() => {
      return tables.value.find(t => t.name === selectedTable.value);
    });

    const newRows = computed(() => editedData.value.filter(r => r._isNew && !r._isDeleted));
    const modifiedRows = computed(() => editedData.value.filter(r => r._isModified && !r._isNew && !r._isDeleted));
    const deletedRows = computed(() => editedData.value.filter(r => r._isDeleted));
    const hasChanges = computed(() => newRows.value.length > 0 || modifiedRows.value.length > 0 || deletedRows.value.length > 0);

    const fetchTables = async () => {
      try {
        const response = await fetch("/admin/database/tables", {
          headers: { Authorization: props.token },
        });
        if (response.ok) {
          const data = await response.json();
          tables.value = data.tables;
        }
      } catch (err) {
        console.error("Failed to fetch tables:", err);
      }
    };

    const selectTable = async (tableName) => {
      selectedTable.value = tableName;
      await refreshData();
    };

    const refreshData = async () => {
      if (!selectedTable.value) return;

      loading.value = true;
      error.value = null;

      try {
        const response = await fetch(`/admin/database/${selectedTable.value}`, {
          headers: { Authorization: props.token },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        columns.value = data.columns;
        tableData.value = data.data;
        // Deep clone for editing
        editedData.value = data.data.map(row => ({ ...row }));
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const getRowKey = (row, index) => {
      const primaryKey = getPrimaryKey(row);
      return primaryKey || `row-${index}`;
    };

    const getPrimaryKey = (row) => {
      if (row.id) return row.id;
      if (row.name) return row.name;
      if (row.token) return row.token;
      return null;
    };

    const isEditable = (column) => {
      // Protect certain columns based on table
      if (selectedTable.value === 'users' && column === 'password_hash') {
        return false; // Password changes should go through proper flow
      }
      if (selectedTable.value === 'file_index' && ['stored_filename', 'mime_type'].includes(column)) {
        return true; // These can be edited but be careful
      }
      return true;
    };

    const getInputType = (column, value) => {
      if (typeof value === 'boolean') return 'checkbox';
      if (typeof value === 'number') return 'number';
      if (value && value.toString().length > 50) return 'textarea';
      return 'text';
    };

    const formatValue = (value) => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      if (typeof value === 'object') return JSON.stringify(value).substring(0, 50);
      if (value && value.toString().length > 100) return value.toString().substring(0, 100) + '...';
      return value;
    };

    const markModified = (index) => {
      if (!editedData.value[index]._isNew) {
        editedData.value[index]._isModified = true;
      }
    };

    const deleteRow = (index) => {
      if (editedData.value[index]._isNew) {
        // Remove new rows immediately
        editedData.value.splice(index, 1);
      } else {
        // Mark existing rows for deletion
        editedData.value[index]._isDeleted = true;
      }
    };

    const undoDelete = (index) => {
      editedData.value[index]._isDeleted = false;
    };

    const addNewRow = () => {
      const newRow = { _isNew: true };
      columns.value.forEach(col => {
        if (col === 'id') {
          newRow[col] = generateId();
        } else if (col === 'is_admin') {
          newRow[col] = false;
        } else if (col === 'quota_in_bytes') {
          newRow[col] = 52428800;
        } else if (col === 'visibility') {
          newRow[col] = 1;
        } else if (col === 'file_size_in_bytes') {
          newRow[col] = 0;
        } else if (col === 'date_added' || col === 'date_of_creation' || col === 'created_at' || col === 'added_on') {
          newRow[col] = new Date().toISOString();
        } else {
          newRow[col] = '';
        }
      });
      editedData.value.unshift(newRow);
    };

    const generateId = () => {
      // Generate a simple ID - for production, use proper UUID
      return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    };

    const discardChanges = () => {
      editedData.value = tableData.value.map(row => ({ ...row }));
    };

    const saveChanges = async () => {
      saving.value = true;
      error.value = null;

      try {
        // Handle deleted rows
        for (const row of deletedRows.value) {
          if (!row._isNew) {
            const primaryKey = getPrimaryKey(row);
            const response = await fetch(`/admin/database/${selectedTable.value}/delete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: props.token,
              },
              body: JSON.stringify({ primaryKey }),
            });

            if (!response.ok) {
              throw new Error(`Failed to delete row: ${await response.text()}`);
            }
          }
        }

        // Handle new rows
        for (const row of newRows.value) {
          const data = { ...row };
          delete data._isNew;
          delete data._isModified;
          delete data._isDeleted;

          const response = await fetch(`/admin/database/${selectedTable.value}/insert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: props.token,
            },
            body: JSON.stringify({ data }),
          });

          if (!response.ok) {
            throw new Error(`Failed to insert row: ${await response.text()}`);
          }
        }

        // Handle modified rows
        for (const row of modifiedRows.value) {
          const primaryKey = getPrimaryKey(row);
          const updates = { ...row };
          delete updates._isNew;
          delete updates._isModified;
          delete updates._isDeleted;

          const response = await fetch(`/admin/database/${selectedTable.value}/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: props.token,
            },
            body: JSON.stringify({ primaryKey, updates }),
          });

          if (!response.ok) {
            throw new Error(`Failed to update row: ${await response.text()}`);
          }
        }

        // Refresh data after successful save
        await refreshData();
      } catch (err) {
        error.value = err.message;
      } finally {
        saving.value = false;
      }
    };

    // Initialize
    fetchTables();

    return {
      tables,
      selectedTable,
      selectedTableInfo,
      columns,
      tableData,
      editedData,
      loading,
      saving,
      error,
      hasChanges,
      newRows,
      modifiedRows,
      deletedRows,
      selectTable,
      refreshData,
      getRowKey,
      isEditable,
      getInputType,
      formatValue,
      markModified,
      deleteRow,
      undoDelete,
      addNewRow,
      discardChanges,
      saveChanges,
    };
  },
};
</script>
