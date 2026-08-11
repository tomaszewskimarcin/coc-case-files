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

  // Listen for socket messages from non-Owner Observers proposing details
  game.socket.on("module.coc-case-files", async (data) => {
    // Only GM processes incoming proposals from Observers
    if (!game.user.isGM) return;

    if (data.action === "propose") {
      const { pageId, field, value } = data;
      
      // Find target page across all journal entries
      let targetPage = null;
      for (const journal of game.journal) {
        targetPage = journal.pages.get(pageId);
        if (targetPage) break;
      }

      if (targetPage) {
        const proposals = foundry.utils.deepClone(targetPage.getFlag("coc-case-files", "proposals") || {});
        proposals[field] = value;
        await targetPage.setFlag("coc-case-files", "proposals", proposals);
        ui.notifications.info(`Otrzymano nową propozycję do akt "${targetPage.name}".`);
      }
    }
  });
});
