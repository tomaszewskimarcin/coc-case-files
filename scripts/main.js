import { PersonnelFileDataModel } from "./dataModels.js";
import { PersonnelFileSheet } from "./sheets.js";

Hooks.once("init", () => {
  console.log("coc-case-files | Initializing Call of Cthulhu Case Files Module");

  const typeName = "coc-case-files.personnel-file";

  // Register Data Model for the Custom Journal Entry Page
  CONFIG.JournalEntryPage.dataModels[typeName] = PersonnelFileDataModel;
  CONFIG.JournalEntryPage.typeLabels[typeName] = "COC-CASE-FILES.PageType";
  CONFIG.JournalEntryPage.typeIcons[typeName] = "fas fa-user-secret";

  // Register the Sheet for the Custom Journal Entry Page
  DocumentSheetConfig.registerSheet(JournalEntryPage, "coc-case-files", PersonnelFileSheet, {
    types: [typeName],
    makeDefault: true,
    label: "COC-CASE-FILES.PageType"
  });

  // Register Module World Setting for Era Themes
  game.settings.register("coc-case-files", "theme", {
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
  game.socket.on("module.coc-case-files", async (data) => {
    // Only GM processes incoming proposals from Observers
    if (!game.user.isGM) return;

    if (data.action === "propose") {
      const { pageUuid, field, value } = data;
      
      // Cannonical document fetch using UUID
      const targetPage = await fromUuid(pageUuid);

      if (targetPage) {
        await targetPage.setFlag("coc-case-files", `proposals.${field}`, value);
        
        ui.notifications.info(game.i18n.format("COC-CASE-FILES.ProposalReceived", { name: targetPage.name }));

        // Soft in-place re-render if sheet is open
        if (targetPage.sheet?.rendered) {
          targetPage.sheet.render(false);
        }
      }
    }
  });
});
