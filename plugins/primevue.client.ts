import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import Dropdown from "primevue/dropdown";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Paginator from "primevue/paginator";
import Dialog from "primevue/dialog";
import Toast from "primevue/toast";
import ToastService from "primevue/toastservice";
import ConfirmDialog from "primevue/confirmdialog";
import ConfirmationService from "primevue/confirmationservice";
import Checkbox from "primevue/checkbox";
import InputNumber from "primevue/inputnumber";
import Tag from "primevue/tag";
import Card from "primevue/card";
import Toolbar from "primevue/toolbar";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(PrimeVue, {
    ripple: true,
    theme: {
      preset: Aura,
    },
  });
  nuxtApp.vueApp.use(ToastService);
  nuxtApp.vueApp.use(ConfirmationService);

  // Register components globally
  nuxtApp.vueApp.component("Button", Button);
  nuxtApp.vueApp.component("InputText", InputText);
  nuxtApp.vueApp.component("Textarea", Textarea);
  nuxtApp.vueApp.component("Dropdown", Dropdown);
  nuxtApp.vueApp.component("DataTable", DataTable);
  nuxtApp.vueApp.component("Column", Column);
  nuxtApp.vueApp.component("Paginator", Paginator);
  nuxtApp.vueApp.component("Dialog", Dialog);
  nuxtApp.vueApp.component("Toast", Toast);
  nuxtApp.vueApp.component("ConfirmDialog", ConfirmDialog);
  nuxtApp.vueApp.component("Checkbox", Checkbox);
  nuxtApp.vueApp.component("InputNumber", InputNumber);
  nuxtApp.vueApp.component("Tag", Tag);
  nuxtApp.vueApp.component("Card", Card);
  nuxtApp.vueApp.component("Toolbar", Toolbar);
});
