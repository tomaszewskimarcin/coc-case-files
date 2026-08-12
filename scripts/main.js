import { PersonnelFileDataModel } from "./dataModels.js";
import { PersonnelFileSheet } from "./sheets.js";
import { getFieldsConfigApp } from "./fieldsConfigApp.js";

export const MODULE_ID = "coc-case-files";

export const CORE_LABEL_KEYS = {
  "fullName": "COC-CASE-FILES.FullName",
  "alias": "COC-CASE-FILES.Alias",
  "gender": "COC-CASE-FILES.Gender",
  "birthDate": "COC-CASE-FILES.BirthDate",
  "appearance.height": "COC-CASE-FILES.Height",
  "appearance.build": "COC-CASE-FILES.Build",
  "appearance.hair": "COC-CASE-FILES.Hair",
  "appearance.eyes": "COC-CASE-FILES.Eyes",
  "appearance.marks": "COC-CASE-FILES.Marks",
  "address": "COC-CASE-FILES.Address"
};

export const DEFAULT_FIELDS_CONFIG = [
  { key: "fullName", labelKey: "COC-CASE-FILES.FullName", label: "Full Name", type: "text", enabled: true, allowProposals: true, isCore: true, isCustom: false },
  { key: "alias", labelKey: "COC-CASE-FILES.Alias", label: "Alias / Nickname", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "gender", labelKey: "COC-CASE-FILES.Gender", label: "Gender", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "birthDate", labelKey: "COC-CASE-FILES.BirthDate", label: "Date of Birth", type: "date", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "appearance.height", labelKey: "COC-CASE-FILES.Height", label: "Height", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "appearance.build", labelKey: "COC-CASE-FILES.Build", label: "Build", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "appearance.hair", labelKey: "COC-CASE-FILES.Hair", label: "Hair Color", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "appearance.eyes", labelKey: "COC-CASE-FILES.Eyes", label: "Eye Color", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "appearance.marks", labelKey: "COC-CASE-FILES.Marks", label: "Distinguishing Marks", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false },
  { key: "address", labelKey: "COC-CASE-FILES.Address", label: "Address", type: "text", enabled: true, allowProposals: true, isCore: false, isCustom: false }
];

const typeMain = `${MODULE_ID}.personnel-file`;
const allTypes = [typeMain];

// 1. Immediate top-level DataModel & CONFIG registration for early document initialization
CONFIG.JournalEntryPage = CONFIG.JournalEntryPage || {};
CONFIG.JournalEntryPage.dataModels = CONFIG.JournalEntryPage.dataModels || {};
CONFIG.JournalEntryPage.typeLabels = CONFIG.JournalEntryPage.typeLabels || {};
CONFIG.JournalEntryPage.typeIcons = CONFIG.JournalEntryPage.typeIcons || {};

allTypes.forEach(t => {
  CONFIG.JournalEntryPage.dataModels[t] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.typeLabels[t] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeIcons[t] = "fas fa-user-secret";
});

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Call of Cthulhu Case Files Module v1.3.0`);

  // Register Handlebars 'eq' helper safely if not present
  if (!Handlebars.helpers["eq"]) {
    Handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });
  }

  // Ensure type is registered in JournalEntryPage.TYPES array for V14 schema validation
  if (Array.isArray(JournalEntryPage.TYPES)) {
    allTypes.forEach(t => {
      if (!JournalEntryPage.TYPES.includes(t)) JournalEntryPage.TYPES.push(t);
    });
  }

  // Register Data Models using non-deprecated V14 API
  allTypes.forEach(t => {
    CONFIG.JournalEntryPage.dataModels[t] = PersonnelFileDataModel;
    CONFIG.JournalEntryPage.typeLabels[t] = "COC-CASE-FILES.PageType";
    CONFIG.JournalEntryPage.typeIcons[t] = "fas fa-user-secret";
  });

  // Use non-deprecated V14 DocumentSheetConfig namespace
  const DocumentSheetConfigApp = foundry.applications?.apps?.DocumentSheetConfig || DocumentSheetConfig;

  // Register the Sheet for custom page types
  DocumentSheetConfigApp.registerSheet(JournalEntryPage, MODULE_ID, PersonnelFileSheet, {
    types: allTypes,
    makeDefault: true,
    label: "COC-CASE-FILES.PageType"
  });

  // Register Fields Configuration World Setting
  game.settings.register(MODULE_ID, "fieldsConfig", {
    name: "Konfiguracja Pol Akt",
    scope: "world",
    config: false,
    type: Array,
    default: DEFAULT_FIELDS_CONFIG
  });

  // Register Setting Menu Button for Fields Configurator
  const FieldsConfigAppClass = getFieldsConfigApp();
  game.settings.registerMenu(MODULE_ID, "fieldsConfigMenu", {
    name: game.i18n.localize("COC-CASE-FILES.FieldsConfigMenuLabel"),
    label: game.i18n.localize("COC-CASE-FILES.FieldsConfigMenuLabel"),
    hint: game.i18n.localize("COC-CASE-FILES.FieldsConfigMenuHint"),
    icon: "fas fa-cogs",
    type: FieldsConfigAppClass,
    restricted: true
  });

  // Register Module World Setting for Era Themes
  game.settings.register(MODULE_ID, "theme", {
    name: game.i18n.localize("COC-CASE-FILES.SettingThemeName"),
    hint: game.i18n.localize("COC-CASE-FILES.SettingThemeHint"),
    scope: "world",
    config: true,
    type: String,
    choices: {
      "polska-80-90": "Polska: Lata 80. i 90. (Policja / MO)",
      "polska-dzis": "Polska: Współczesna Policja",
      "polska-20lecie": "Polska: II Rzeczpospolita (Policja Państwowa 1919-1939)",
      "uniwersalny-20lecie": "Uniwersalny: Lata 20. (Klasyczne Dossier 1920s)",
      "uniwersalny-80-90": "Uniwersalny: Lata 80. i 90. (Druk Maszynowy)",
      "uniwersalny-dzis": "Uniwersalny: Współczesny (Modern Digital Dossier)"
    },
    default: "polska-80-90",
    onChange: () => {
      ui.journals?.render(true);
    }
  });

  // Listen for socket messages from non-Owner Observers proposing details
  game.socket.on(`module.${MODULE_ID}`, async (data) => {
    // Only GM processes incoming proposals from Observers
    if (!game.user.isGM) return;

    if (data.action === "propose") {
      const { pageUuid, field, value } = data;
      
      // Cannonical document fetch using UUID
      const targetPage = await fromUuid(pageUuid);

      if (targetPage) {
        await targetPage.setFlag(MODULE_ID, `proposals.${field}`, value);
        
        ui.notifications.info(game.i18n.format("COC-CASE-FILES.ProposalReceived", { name: targetPage.name }));

        // Soft in-place re-render if sheet is open
        if (targetPage.sheet?.rendered) {
          targetPage.sheet.render(false);
        }
      }
    }
  });
});
