import { PersonnelFileDataModel } from "./dataModels.js";
import { PersonnelFileSheet } from "./sheets.js";

export const MODULE_ID = "coc-case-files-dev";

const typeDev = `${MODULE_ID}.personnel-file`;
const typeMain = "coc-case-files.personnel-file";

// Immediate top-level DataModel registration so Foundry V14 schema validation passes during early document initialization
if (globalThis.CONFIG?.JournalEntryPage) {
  CONFIG.JournalEntryPage.dataModels[typeDev] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.dataModels[typeMain] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.typeLabels[typeDev] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeLabels[typeMain] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeIcons[typeDev] = "fas fa-user-secret";
  CONFIG.JournalEntryPage.typeIcons[typeMain] = "fas fa-user-secret";
}

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Initializing Call of Cthulhu Case Files Module (DEV)`);

  // Ensure both document types are registered in JournalEntryPage.TYPES array for V14 schema validation
  if (Array.isArray(JournalEntryPage.TYPES)) {
    if (!JournalEntryPage.TYPES.includes(typeDev)) JournalEntryPage.TYPES.push(typeDev);
    if (!JournalEntryPage.TYPES.includes(typeMain)) JournalEntryPage.TYPES.push(typeMain);
  }

  // Register Data Models for DEV and Main types
  CONFIG.JournalEntryPage.dataModels[typeDev] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.dataModels[typeMain] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.typeLabels[typeDev] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeLabels[typeMain] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeIcons[typeDev] = "fas fa-user-secret";
  CONFIG.JournalEntryPage.typeIcons[typeMain] = "fas fa-user-secret";

  // Register the Sheet for both custom page types
  DocumentSheetConfig.registerSheet(JournalEntryPage, MODULE_ID, PersonnelFileSheet, {
    types: [typeDev, typeMain],
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
