import { CORE_LABEL_KEYS, DEFAULT_FIELDS_CONFIG } from "./main.js";

export const MODULE_ID = "coc-case-files-dev";

let _FieldsConfigApp = null;

export function getFieldsConfigApp() {
  if (!_FieldsConfigApp) {
    _FieldsConfigApp = class FieldsConfigApp extends FormApplication {
      constructor(object = {}, options = {}) {
        super(object, options);
        this.fields = foundry.utils.deepClone(game.settings.get(MODULE_ID, "fieldsConfig") || []);
      }

      /** @override */
      static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          id: `${MODULE_ID}-fields-config`,
          title: game.i18n?.localize ? game.i18n.localize("COC-CASE-FILES.FieldsConfigTitle") : "Personnel File Fields Manager",
          template: `modules/${MODULE_ID}/templates/fields-config.hbs`,
          width: 860,
          height: "auto",
          closeOnSubmit: true
        });
      }

      /** @override */
      async getData(options = {}) {
        const context = await super.getData(options);
        context.fields = this.fields.map((f, i) => {
          let displayLabel = "";
          const coreKey = CORE_LABEL_KEYS[f.key] || f.labelKey;

          if (coreKey && game.i18n?.has(coreKey)) {
            displayLabel = game.i18n.localize(coreKey);
          } else {
            displayLabel = f.label || f.key;
          }

          return {
            ...f,
            index: i,
            displayLabel: displayLabel,
            optionsStr: Array.isArray(f.options) ? f.options.join(", ") : (f.optionsStr || "")
          };
        });
        return context;
      }

      /** @override */
      activateListeners(html) {
        super.activateListeners(html);
        const root = html[0] || html;

        // Toggle options input disabled status based on type selection
        root.querySelectorAll(".field-type-select").forEach(select => {
          select.addEventListener("change", () => {
            const index = select.dataset.index;
            const row = select.closest("tr");
            const optionsInput = row?.querySelector(`input[name="fields.${index}.optionsStr"]`);
            if (optionsInput) {
              optionsInput.disabled = select.value !== "select";
            }
          });
        });

        // Delete custom field button listener
        root.querySelectorAll("[data-action='delete-field']").forEach(btn => {
          btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index, 10);
            if (!isNaN(index)) {
              this.fields.splice(index, 1);
              this.render(true);
            }
          });
        });

        // Add custom field button listener
        root.querySelector("[data-action='add-field']")?.addEventListener("click", () => {
          const customKey = `custom_${Date.now()}`;
          const defaultLabel = game.i18n?.localize ? game.i18n.localize("COC-CASE-FILES.NewFieldDefaultLabel") : "New Field";
          this.fields.push({
            key: customKey,
            label: defaultLabel,
            type: "text",
            enabled: true,
            allowProposals: true,
            isCustom: true,
            isCore: false,
            options: []
          });
          this.render(true);
        });

        // Reset to defaults button listener
        root.querySelector("[data-action='reset-defaults']")?.addEventListener("click", async () => {
          this.fields = foundry.utils.deepClone(DEFAULT_FIELDS_CONFIG);
          await game.settings.set(MODULE_ID, "fieldsConfig", this.fields);
          ui.notifications.info(game.i18n.localize("COC-CASE-FILES.ResetDefaultsSuccess"));
          this.render(true);
        });
      }

      /** @override */
      async _updateObject(event, formData) {
        const expanded = foundry.utils.expandObject(formData);
        const updatedFields = [];
        const fieldEntries = expanded.fields ? Object.values(expanded.fields) : [];

        fieldEntries.forEach((entry, index) => {
          const original = this.fields[index];
          if (!original) return;

          const type = entry.type || original.type || "text";
          const optionsArray = type === "select" && entry.optionsStr
            ? entry.optionsStr.split(",").map(s => s.trim()).filter(Boolean)
            : (original.options || []);

          const labelKey = CORE_LABEL_KEYS[original.key] || original.labelKey || null;

          updatedFields.push({
            key: original.key,
            labelKey: labelKey,
            label: entry.label || original.label || original.key,
            type: type,
            enabled: original.isCore ? true : Boolean(entry.enabled),
            allowProposals: Boolean(entry.allowProposals),
            isCore: Boolean(original.isCore),
            isCustom: Boolean(original.isCustom),
            options: optionsArray
          });
        });

        await game.settings.set(MODULE_ID, "fieldsConfig", updatedFields);
        const savedMsg = game.i18n?.localize ? game.i18n.localize("COC-CASE-FILES.FieldsConfigSaved") : "Configuration saved.";
        ui.notifications.info(savedMsg);
        ui.journals?.render(true);
      }
    };
  }
  return _FieldsConfigApp;
}
