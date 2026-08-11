# Call of Cthulhu Case Files

A Foundry VTT module providing custom, interactive Journal Entry templates tailored for a 1990s Polish Police investigation setting.

## Features

- **Personnel File (Akta Osobowe):** A custom Journal Entry page type for managing suspects, witnesses, and victims.
- **1990s Polish Police Aesthetic:** Styled to resemble typed documents on classic paper folders, utilizing typewriter fonts and ink stamps.
- **Interactive Player Investigation:** Players with Owner or Observer access can type in missing fields (like Height, Address, or distinguishing marks) directly in the file as they discover them.
- **GM Approval & Chaos Points System:** Proposed edits are visible only to the GM as pending. When the GM approves them, the module integrates with the `coc-victory-points` module to automatically award 1 Chaos Point to the party and saves the data directly to the journal page.

## Installation

You can install this module by pasting the following manifest link into the Foundry VTT Module Setup screen:
`https://raw.githubusercontent.com/tomaszewskimarcin/coc-case-files/refs/heads/master/module.json`

## Requirements
- Minimum Foundry VTT v12 (Uses V12+ Application V2 and Data Models).
- (Optional but recommended) `coc-victory-points` module for automatic Chaos Point rewards upon information approval.

## Usage

1. Create a new Journal Entry.
2. Click "Add Page".
3. Select the "Personnel File" (Akta Osobowe) page type.
4. As a GM, you can edit the core details immediately using the Edit view (click the pencil icon).
5. As a Player with access, if a field is blank, you can type into it to propose a detail.
6. As a GM viewing the page, you'll see a ✅ / ❌ next to player proposals. Clicking ✅ merges it into the document and awards points!
