<template>
  <div class="p-6 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-gray-200 rounded-t-lg">
      <h1 class="text-2xl font-bold text-gray-900">
        {{ isEdit ? "Edit Game" : "Register New Game" }}
      </h1>
    </div>
    <div class="bg-white rounded-lg shadow-lg">
      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Basic Information -->
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Basic Info</h2>

          <!-- PrimeVue DataTable for Basic Info -->
          <DataTable
            :value="basicInfoData"
            class="register-datatable p-datatable-sm"
            :showHeaders="false"
          >
            <Column field="field" header="Field" style="width: 20%">
              <template #body="{ data }">
                <span class="font-medium text-left">{{ data.field }}</span>
              </template>
            </Column>
            <Column field="value" header="Value" style="width: 70%">
              <template #body="{ data }">
                <div v-if="data.field === 'Category'" style="max-width: 175px">
                  <Dropdown
                    v-model="form.category"
                    :options="categoryOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select category"
                    style="width: 100%; max-width: 175px"
                  />
                </div>
                <div v-else-if="data.field === 'ID'" style="max-width: 300px">
                  <InputText
                    v-model="form.id"
                    placeholder="Enter unique game ID"
                    :disabled="isEdit"
                    style="width: 100%; max-width: 300px"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>

        <!-- Multi-language Game Names -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">
            Multi-languages Info
          </h3>

          <!-- HTML Table for Multi-languages -->
          <table class="w-full custom-language-table">
            <!-- Header Row -->
            <thead>
              <tr class="bg-gray-50">
                <th
                  class="px-4 py-3 text-left border-r border-gray-300"
                  style="width: 150px"
                >
                  Input by Language
                </th>
                <th
                  class="px-4 py-3 text-start border-r border-gray-300"
                  style="width: 400px"
                >
                  <div
                    class="flex items-center cursor-pointer p-1 rounded transition-colors"
                    @click="setDefaultLanguage"
                  >
                    <!-- Custom styled HTML checkbox -->
                    <input
                      type="checkbox"
                      :checked="isCurrentLanguageDefault"
                      class="mr-2 custom-checkbox"
                      readonly
                    />
                    <span>Default Language</span>
                  </div>
                </th>
                <th class="px-4 py-3 text-center" style="width: 150px">
                  <div
                    class="flex items-center justify-center cursor-pointer p-1 rounded transition-colors"
                    @click="deleteCurrentLanguage"
                  >
                    <i
                      class="pi pi-trash mr-2"
                      style="color: #dc2626; font-size: 16px"
                    ></i>
                    <span class="text-red-600">Delete language</span>
                  </div>
                </th>
              </tr>
            </thead>
            <!-- Body Row -->
            <tbody>
              <tr>
                <!-- First Column: Languages List -->
                <td class="px-4 py-3 border-r border-gray-300 align-top">
                  <div
                    v-for="(lang, index) in form.languages"
                    :key="index"
                    class="mb-2"
                  >
                    <span
                      class="text-sm font-medium cursor-pointer px-2 py-1 rounded transition-colors"
                      :class="[
                        selectedLanguageIndex === index
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100',
                        lang.isDefault ? 'border-2 border-green-500' : '',
                      ]"
                      @click="selectLanguage(index)"
                    >
                      {{ getLanguageLabel(lang.code) }}
                    </span>
                  </div>
                  <Button
                    label="Add language"
                    icon="pi pi-plus"
                    @click="addLanguage"
                    class="p-button-sm p-button-outlined"
                    style="margin-top: 10px"
                  />
                </td>
                <!-- Second Column: Spanning 2 header columns -->
                <td class="px-4 py-3 text-left align-top" colspan="2">
                  <div class="mb-3">
                    <span class="font-medium text-gray-900">Name</span>
                  </div>
                  <div
                    v-if="form.languages[selectedLanguageIndex]"
                    class="mb-2"
                  >
                    <div class="mb-2">
                      <InputText
                        v-model="form.languages[selectedLanguageIndex].name"
                        :placeholder="`Enter name for ${getLanguageLabel(
                          form.languages[selectedLanguageIndex].code
                        )}`"
                        class="w-full"
                        style="max-width: 300px"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Add Language Dialog -->
          <Dialog
            v-model:visible="showAddLanguageDialog"
            modal
            header="Add Language"
            :style="{
              width: '25rem',
              backgroundColor: '#ffffff',
              color: '#000000',
            }"
            :closable="true"
          >
            <div class="flex flex-col gap-4">
              <div>
                <label
                  for="languageSelect"
                  class="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Language:
                </label>
                <Dropdown
                  id="languageSelect"
                  v-model="selectedNewLanguage"
                  :options="availableLanguagesToAdd"
                  optionLabel="label"
                  placeholder="Choose a language"
                  class="w-full"
                />
              </div>
            </div>

            <template #footer>
              <div class="flex justify-center gap-2">
                <Button
                  label="Add"
                  icon="pi pi-plus"
                  @click="confirmAddLanguage"
                  class="p-button-sm"
                  style="width: 100px"
                />
              </div>
            </template>
          </Dialog>

          <!-- Action Buttons -->
          <div class="flex justify-end gap-4 mt-6 border-t border-gray-200">
            <Button
              label="Return To List Page"
              @click="$router.push('/')"
              class="p-button-outlined custom-button-outlined"
            />
            <Button
              :label="isEdit ? 'Edit' : 'Register'"
              @click="handleSubmit"
              :loading="loading"
              class="p-button custom-button"
            />
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const loading = ref(false);

// Check if this is edit mode
const isEdit = computed(() => !!route.query.id);
const gameId = computed(() => route.query.id);

console.log("Register page - isEdit:", isEdit.value, "gameId:", gameId.value);

// Computed property to check if current selected language is default
const isCurrentLanguageDefault = computed(() => {
  const currentLang = form.value.languages[selectedLanguageIndex.value];
  const result = currentLang?.isDefault === true;
  console.log(
    `isCurrentLanguageDefault: selectedIndex=${selectedLanguageIndex.value}, isDefault=${currentLang?.isDefault}, result=${result}`
  );
  return result;
});

// Computed property to get available languages for adding
const availableLanguagesToAdd = computed(() => {
  const usedCodes = form.value.languages.map((lang) => lang.code);
  return availableLanguages.filter((lang) => !usedCodes.includes(lang.code));
});

// Form data
const form = ref({
  id: "",
  category: "",
  languages: [{ code: "EN", name: "", isDefault: true }],
  description: "",
  status: "active",
});

// Track selected language for editing
const selectedLanguageIndex = ref(0);

// Add language dialog state
const showAddLanguageDialog = ref(false);
const selectedNewLanguage = ref(null);

// Basic info data for DataTable
const basicInfoData = ref([
  { field: "Category", value: "" },
  { field: "ID", value: "" },
]);

// Language table data for DataTable
const languageTableData = ref([{ type: "languages" }]);

// Category options for dropdown
const categoryOptions = ref([
  { label: "RPG", value: "RPG" },
  { label: "Racing", value: "Racing" },
  { label: "Strategy", value: "Strategy" },
  { label: "Action", value: "Action" },
  { label: "Puzzle", value: "Puzzle" },
  { label: "Sports", value: "Sports" },
]);

// Available languages
const availableLanguages = [
  { code: "EN", label: "English" },
  { code: "KO", label: "한국어 (Korean)" },
  { code: "JA", label: "日本語 (Japanese)" },
];

// Helper function to get language label
const getLanguageLabel = (code) => {
  if (!code) return "Select Language";
  const lang = availableLanguages.find((l) => l.code === code);
  return lang ? lang.label : code;
};

// Load existing game data if editing
onMounted(async () => {
  if (isEdit.value) {
    try {
      console.log("Loading game for edit:", gameId.value);

      // Fetch existing game data
      const gameData = await $fetch(`/api/games?id=${gameId.value}`);

      if (gameData) {
        // Populate form with existing data
        form.value.id = gameData.id;
        form.value.category = gameData.category;
        form.value.description = gameData.description || "";

        // Transform names object back to languages array
        const languages = [];
        if (gameData.names) {
          Object.entries(gameData.names).forEach(([code, name]) => {
            const isDefault = code === gameData.defaultLanguage;
            languages.push({
              code: code.toUpperCase(),
              name: name,
              isDefault: isDefault,
            });
          });
        }

        // Ensure we have at least one language
        if (languages.length === 0) {
          languages.push({ code: "EN", name: "", isDefault: true });
        }

        form.value.languages = languages;

        console.log("Loaded game data:", gameData);
        console.log("Transformed form data:", form.value);
      }
    } catch (error) {
      console.error("Error loading game:", error);
      alert("Error loading game data. Please try again.");
    }
  }

  // Auto-focus first input
  const firstInput = document.querySelector('input[type="text"]');
  if (firstInput) {
    firstInput.focus();
  }
});

// Add new language entry - show dialog
const addLanguage = () => {
  if (availableLanguagesToAdd.value.length === 0) {
    alert("All available languages have been added.");
    return;
  }
  showAddLanguageDialog.value = true;
  selectedNewLanguage.value = null;
};

// Confirm add language
const confirmAddLanguage = () => {
  if (!selectedNewLanguage.value) {
    alert("Please select a language to add.");
    return;
  }

  const languageToAdd = selectedNewLanguage.value;
  console.log("Adding language:", languageToAdd);

  form.value.languages.push({
    code: languageToAdd.code,
    name: "",
    isDefault: false,
  });

  // Auto select the newly added language
  selectedLanguageIndex.value = form.value.languages.length - 1;

  // Close dialog and reset
  showAddLanguageDialog.value = false;
  selectedNewLanguage.value = null;

  console.log("Updated languages:", form.value.languages);
};

// Select language for editing
const selectLanguage = (index) => {
  console.log("Selecting language index:", index);
  console.log("Available languages:", form.value.languages);
  selectedLanguageIndex.value = index;
  console.log("Updated selectedLanguageIndex:", selectedLanguageIndex.value);
};

// Set default language for currently selected language
const setDefaultLanguage = () => {
  console.log(
    "Setting default language for index:",
    selectedLanguageIndex.value
  );
  form.value.languages.forEach((lang, index) => {
    const wasDefault = lang.isDefault;
    lang.isDefault = index === selectedLanguageIndex.value;
    console.log(
      `Language ${index} (${lang.code}): ${wasDefault} -> ${lang.isDefault}`
    );
  });
  console.log("Updated languages:", form.value.languages);
};

// Delete current selected language
const deleteCurrentLanguage = () => {
  if (form.value.languages.length <= 1) {
    alert(
      "Cannot delete the last language. At least one language is required."
    );
    return;
  }

  const currentLang = form.value.languages[selectedLanguageIndex.value];
  const isDefault = currentLang?.isDefault;

  // Remove the selected language
  form.value.languages.splice(selectedLanguageIndex.value, 1);

  // If deleted language was default, set first language as default
  if (isDefault && form.value.languages.length > 0) {
    form.value.languages[0].isDefault = true;
  }

  // Adjust selectedLanguageIndex if necessary
  if (selectedLanguageIndex.value >= form.value.languages.length) {
    selectedLanguageIndex.value = form.value.languages.length - 1;
  }

  console.log("Deleted language, updated array:", form.value.languages);
  console.log("New selectedLanguageIndex:", selectedLanguageIndex.value);
};

// Form submission
const handleSubmit = async () => {
  loading.value = true;

  try {
    // Validate form
    if (!form.value.id || !form.value.category) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate at least one language with name
    const hasValidLanguage = form.value.languages.some(
      (lang) => lang.code && lang.name
    );
    if (!hasValidLanguage) {
      alert("Please add at least one language with name");
      return;
    }

    // Transform form data to match API format
    const gameData = {
      id: form.value.id,
      category: form.value.category,
      names: {},
      defaultLanguage: "",
      description: form.value.description || "",
    };

    // Build names object and find default language
    form.value.languages.forEach((lang) => {
      if (lang.name) {
        gameData.names[lang.code.toLowerCase()] = lang.name;
      }
      if (lang.isDefault) {
        gameData.defaultLanguage = lang.code.toLowerCase();
      }
    });

    console.log("Submitting form data:", gameData);

    // Call API
    const response = await $fetch("/api/games", {
      method: isEdit.value ? "PUT" : "POST",
      body: gameData,
    });

    if (response.success) {
      // Show success message
      alert(
        isEdit.value
          ? "Game updated successfully!"
          : "Game created successfully!"
      );

      // Navigate back to game list
      await navigateTo("/");
    } else {
      throw new Error("API response indicated failure");
    }
  } catch (error) {
    console.error("Error saving game:", error);
    alert("Error saving game. Please try again.");
  } finally {
    loading.value = false;
  }
};

// Auto-focus first input on mount
onMounted(() => {
  const firstInput = document.querySelector('input[type="text"]');
  if (firstInput) {
    firstInput.focus();
  }
});
</script>

<style scoped>
:deep(.register-datatable) {
  border: none !important;
}

:deep(.register-datatable .p-datatable-thead) {
  display: none !important;
}

/* Text alignment - left align */
:deep(.register-datatable .p-datatable-tbody > tr > td:first-child) {
  text-align: left !important;
  vertical-align: middle !important;
  padding-left: 1rem !important;
}

:deep(.register-datatable .p-datatable-tbody > tr > td:last-child) {
  text-align: left !important;
  vertical-align: middle !important;
}

/* Disable zebra striping - all rows same color */
:deep(.register-datatable .p-datatable-tbody > tr:nth-child(odd) td) {
  background-color: #ffffff !important;
}

:deep(.register-datatable .p-datatable-tbody > tr:nth-child(even) td) {
  background-color: #ffffff !important;
}

/* Disable hover effects */
:deep(.register-datatable .p-datatable-tbody > tr:hover td) {
  background-color: #ffffff !important;
}

/* Make dropdown and input text align to left edge */
:deep(.register-datatable .p-select-label) {
  padding-left: 0 !important;
}

:deep(.register-datatable .p-dropdown-label) {
  padding-left: 0 !important;
}

.p-datatable {
  border-radius: 0 !important;
}

/* Custom HTML table styling */
.custom-language-table {
  border: 1px solid #000000 !important;
  border-collapse: collapse !important;
}

.custom-language-table th {
  border: 1px solid #000000 !important;
  background-color: #f9fafb !important;
  color: #000000 !important;
  font-weight: normal !important;
}

.custom-language-table td {
  border: 1px solid #000000 !important;
  color: #000000 !important;
}

.custom-language-table th span,
.custom-language-table td span {
  color: #000000 !important;
}

/* Custom checkbox styling to match PrimeVue */
.custom-checkbox {
  width: 16px !important;
  height: 16px !important;
  border: 1px solid #000000 !important;
  border-radius: 3px !important;
  background-color: #ffffff !important;
  cursor: pointer !important;
  position: relative !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
}

.custom-checkbox:checked {
  background-color: #000000 !important;
  border-color: #000000 !important;
}

.custom-checkbox:checked::after {
  content: "✓" !important;
  position: absolute !important;
  top: -1px !important;
  left: 3px !important;
  color: white !important;
  font-size: 12px !important;
  font-weight: bold !important;
}

.custom-checkbox:hover {
  border-color: #333333 !important;
}

.custom-checkbox:focus {
  outline: 2px solid #666666 !important;
  outline-offset: 2px !important;
}

/* Custom button styles */
:deep(.custom-button-outlined) {
  color: #000000 !important;
  border: 1px solid #000000 !important;
  background-color: transparent !important;
  border-radius: 4px !important;
}

:deep(.custom-button-outlined:hover) {
  color: #ffffff !important;
  background-color: #bdbdbd !important;
  border-radius: 4px !important;
}

:deep(.custom-button) {
  color: #ffffff !important;
  background-color: #000000 !important;
  border: 1px solid #000000 !important;
  border-radius: 4px !important;
}

:deep(.custom-button:hover) {
  color: #ffffff !important;
  background-color: #333333 !important;
  border: 1px solid #333333 !important;
  border-radius: 4px !important;
}
</style>
