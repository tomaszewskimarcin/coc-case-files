import { PersonnelFileDataModel } from "./dataModels.js";
import { PersonnelFileSheet } from "./sheets.js";

export const MODULE_ID = "coc-case-files-dev";

const typeDev = `${MODULE_ID}.personnel-file`;
const typeMain = "coc-case-files.personnel-file";
const typeDouble = `${MODULE_ID}.coc-case-files.personnel-file`;

const allTypes = [typeDev, typeMain, typeDouble];

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

// 2. Intercept raw source document creation BEFORE SchemaField#_validateRecursive runs
if (typeof JournalEntryPage !== "undefined" && JournalEntryPage.migrateData) {
  const originalMigrateData = JournalEntryPage.migrateData;
  JournalEntryPage.migrateData = function (source) {
    if (source && typeof source === "object") {
      if (source.type === typeDouble || source.type === typeMain) {
        console.log(`${MODULE_ID} | Intercepted legacy raw page type '${source.type}', auto-coercing to '${typeDev}'`);
        source.type = typeDev;
      }
    }
    return originalMigrateData.call(this, source);
  };
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Call of Cthulhu Case Files Module (DEV)`);

  // Register Handlebars 'eq' helper safely if not present
  if (!Handlebars.helpers["eq"]) {
    Handlebars.registerHelper("eq", function (a, b) {
      return a === b;
    });
  }

  // Ensure all type variants are registered in JournalEntryPage.TYPES array for V14 schema validation
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

  // Register the Sheet for all custom page types
  DocumentSheetConfigApp.registerSheet(JournalEntryPage, MODULE_ID, PersonnelFileSheet, {
    types: allTypes,
    makeDefault: true,
    label: "COC-CASE-FILES.PageType"
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

// Auto-migrate any page with legacy double-prefixed type name in world database
Hooks.once("ready", async () => {
  if (!game.user.isGM || !game.journal) return;
  for (const journal of game.journal) {
    for (const page of journal.pages) {
      if (page.type === typeDouble || page.type === typeMain) {
        console.log(`${MODULE_ID} | Auto-migrating page '${page.name}' from legacy type ${page.type} to ${typeDev}`);
        await page.update({ type: typeDev });
      }
    }
  }
});
