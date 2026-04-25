// English source-of-truth translations. All other locales are typed as
// `Partial<Translation>` against this file and fall back to English for
// any missing key.

const en = {
  // Toolbar
  "app.title": "Mission Editor",
  "toolbar.new": "New",
  "toolbar.open": "Open",
  "toolbar.import": "Import",
  "toolbar.save": "Save",
  "toolbar.saveAs": "Save As",
  "toolbar.preview": "Preview",
  "toolbar.undo": "Undo",
  "toolbar.redo": "Redo",
  "toolbar.settings": "Settings",
  "toolbar.close": "Close",
  "toolbar.recent": "Recent",

  "toolbar.importTooltip": "Import from game folder",

  // Empty states
  "empty.noBundle": "Open a mission bundle JSON file or create a new one to get started.",
  "empty.noMission": "Select a mission from the sidebar or add a new one.",

  // Bottom tabs
  "tab.issues": "Issues",
  "tab.flowGraph": "Flow Graph",
  "flow.fit": "Fit",
  "flow.center": "Center",
  "flow.missions": "{{count}} missions",
  "flow.links": "{{count}} links",
  "flow.mission": "Mission {{id}}",
  "flow.orphan": "Orphaned",
  "flow.objectives": "{{count}} obj",
  "flow.rewards": "{{count}} rew",
  "flow.hint": "Double-click to add, drag handles to link",
  "flow.resetLayout": "Reset Layout",
  "flow.deleteNode": "Delete mission",

  // Toast
  "toast.saved": "Saved successfully",

  // Updater
  "update.available": "Update Available",
  "update.newVersion": "Version {{version}} is available (you have {{current}}).",
  "update.installNow": "Install & Restart",
  "update.later": "Later",
  "update.downloading": "Downloading... {{percent}}%",
  "update.downloadingUnknown": "Downloading...",

  // Confirmations
  "confirm.closeBundle": "This bundle has unsaved changes. Close anyway?",
  "confirm.closeBundleTitle": "Unsaved Changes",
  "confirm.deleteMission": "Delete this mission?",
  "confirm.unsavedChanges": "You have unsaved changes. Are you sure you want to close?",

  // Sidebar extras
  "sidebar.duplicate": "Duplicate",
  "sidebar.edited": "Edited since last save",

  // Bundle editor
  "bundle.title": "Bundle Settings",
  "bundle.name": "Name",
  "bundle.version": "Version",
  "bundle.authors": "Authors",
  "bundle.mods": "Required Mods",
  "bundle.description": "Description",
  "bundle.repeat": "Repeat Interval",
  "bundle.unlock": "Unlock Condition",
  "bundle.vars": "Variables",
  "bundle.varsPlaceholder": "Reserved field — currently unused by the mod, kept for round-trip compatibility",
  "bundle.metadata": "Metadata",
  "bundle.behavior": "Behavior",
  "bundle.advanced": "Advanced",
  "bundle.collapse": "Collapse bundle settings",
  "bundle.expand": "Expand bundle settings",
  "bundle.repeatPlaceholder": "-1 for infinite, or number of game days",

  // Mission editor
  "mission.title": "Mission",
  "mission.id": "Mission ID",
  "mission.translated": "Translated",
  "mission.translatedHint": "Values are translation keys",
  "mission.property": "Race or class",
  "mission.propertyPlaceholder": "default, Saiyan, Namekian, MartialArtist, ...",
  "mission.alignment": "Alignment",
  "mission.fieldTitle": "Title",
  "mission.subtitle": "Subtitle",
  "mission.description": "Description",
  "mission.content": "Content",
  "mission.variant": "Variant",
  "mission.addVariant": "+ Variant",
  "mission.duplicateVariant": "Duplicate variant",
  "mission.duplicateSuffix": " (copy)",
  "mission.default": "default",
  "mission.noTranslation": "No translation found for \"{{value}}\"",
  "mission.variantRenameTooltip": "Double-click to rename",
  "mission.variantFallback": "fallback",
  "mission.variantFallbackTooltip": "Variant 0 is the fallback. Players whose race or class doesn't match any other variant see this one.",
  "mission.variantUnreachableHalfSaiyan": "\"Half-Saiyan\" never matches in saga mode — Half-Saiyans are remapped to the Saiyan slot before lookup. Use a \"Saiyan\" variant instead.",
  "mission.variantCatchesHalfSaiyan": "Also matches Half-Saiyan players.",
  "mission.variantUnknownProp": "\"{{value}}\" doesn't match any known race or class. This variant will never be selected.",
  "mission.variantRandomReward": "Random reward mode: any reward button picks a random choice from this variant's rewards. Race/class matching is bypassed.",
  "mission.variantRandomRewardWrongSlot": "\"randrew\" only takes effect on variant 0. In other slots it acts as an unrecognized name and the variant will never be selected.",
  "mission.variantMatchesRace": "Matches {{race}} players.",
  "mission.variantMatchesClass": "Matches the {{class}} class.",
  "mission.simulator": "Test player",
  "mission.simulatorRace": "Race",
  "mission.simulatorClass": "Class",
  "mission.simulatorResult": "→ variant #{{index}}",
  "mission.coverageOnly": "Catches: {{names}}.",
  "mission.coverageRest": "Other races/classes use the default.",

  // Alignment options
  "align.good": "Good",
  "align.neutral": "Neutral",
  "align.evil": "Evil",

  // Objectives
  "objectives.title": "Objectives",
  "objectives.add": "+ Add Objective",
  "objectives.presets": "Presets",
  "objectives.presetsTitle": "Objective Presets",
  "objectives.action": "Action",
  "objectives.actionHint": "Button shown when the player advances",
  "objectives.moveUp": "Move up",
  "objectives.moveDown": "Move down",
  "objectives.remove": "Remove",
  "objectives.noTranslation": "No translation for \"{{value}}\"",
  "objectives.powerLevel": "Est. power level",

  // Objective preset templates
  "objPreset.kill": "Kill Boss",
  "objPreset.killDesc": "Kill a single named entity",
  "objPreset.killsame": "Kill Multiple",
  "objPreset.killsameDesc": "Kill N of the same entity",
  "objPreset.talk": "Talk to NPC",
  "objPreset.talkDesc": "Speak to a specific entity",
  "objPreset.item": "Gather Item",
  "objPreset.itemDesc": "Collect N of an item",
  "objPreset.biome": "Visit Biome",
  "objPreset.biomeDesc": "Travel to a named biome",
  "objPreset.biome2": "Stay in Biome",
  "objPreset.biome2Desc": "Be in a biome while finishing other steps",
  "objPreset.dim": "Visit Dimension",
  "objPreset.dimDesc": "Travel to a named dimension",
  "objPreset.lvl": "Reach Level",
  "objPreset.lvlDesc": "Reach a minimum player level",
  "objPreset.state": "Transformation State",
  "objPreset.stateDesc": "Be in a specific transformation",

  // Objective protect options
  "protect.default": "Default (must kill specific)",
  "protect.spawn": "Spawn (any will do)",
  "protect.no": "No protect (any will do)",

  // Objective type labels
  "objType.kill": "Kill Entity",
  "objType.killsame": "Kill Multiple",
  "objType.biome": "Go to Biome",
  "objType.biome2": "Be in Biome",
  "objType.dim": "Go to Dimension",
  "objType.dim2": "Be in Dimension",
  "objType.item": "Gather Item",
  "objType.talk": "Talk to NPC",
  "objType.state": "Transformation State",
  "objType.lvl": "Reach Level",
  "objType.next": "Click Next",
  "objType.start": "Click Start",
  "objType.skip": "Click Skip",
  "objType.restart": "Click Restart",

  // Objective field labels
  "objField.type": "Type",
  "objField.name": "Name / Target",
  "objField.health": "Health",
  "objField.attack": "Attack",
  "objField.amount": "Amount",
  "objField.spawnMessage": "Spawn Message",
  "objField.deathMessage": "Death Message",
  "objField.protect": "Protect Mode",
  "objField.transformations": "Transformations",
  "objField.spawnSound": "Spawn Sound",
  "objField.deathSound": "Death Sound",
  "objField.dialog": "Dialog Text",
  "objField.button": "Button Text",

  // Rewards
  "rewards.title": "Rewards",
  "rewards.presets": "Presets",
  "rewards.addChoice": "+ Add Choice",
  "rewards.choice": "Choice",
  "rewards.buttonName": "Button Name",
  "rewards.nextMissionId": "Next Mission ID",
  "rewards.components": "Components",
  "rewards.addComponent": "+ Add",
  "rewards.buttonPlaceholder": "Translation key or display name",
  "rewards.noTranslation": "No translation for \"{{value}}\"",

  // Reward type labels
  "rewType.nothing": "Nothing",
  "rewType.tp": "Training Points",
  "rewType.item": "Item",
  "rewType.align": "Alignment",
  "rewType.com": "Command",

  // Reward TP mode labels
  "tpMode.fix": "Fixed",
  "tpMode.lvl": "Per Level",
  "tpMode.align": "Per Alignment",
  "tpMode.lvlalign": "Per Level+Alignment",

  // Reward placeholders
  "reward.tpPlaceholder": "Amount or multiplier",
  "reward.alignPlaceholder": "+10, -10, or 0 (auto-balance)",
  "reward.itemPlaceholder": "mod:itemname::metadata,count",
  "reward.comPlaceholder": "Command (@p for player name)",

  // Sidebar
  "sidebar.bundles": "Bundles",
  "sidebar.missions": "Missions",
  "sidebar.search": "Search missions...",
  "sidebar.addMission": "Add mission",
  "sidebar.fromTemplate": "From template",
  "sidebar.copyToBundle": "Copy to bundle",
  "sidebar.delete": "Delete",
  "sidebar.untitled": "Untitled",
  "sidebar.noBundles": "Open a JSON file or create a new bundle.",
  "sidebar.noMissions": "No missions yet. Click \"+\" to create one.",
  "sidebar.closeBundle": "Close bundle",
  "sidebar.noResults": "No missions matching \"{{query}}\"",

  // Validation
  "validation.noIssues": "No issues found",
  "validation.error": "error",
  "validation.errors": "errors",
  "validation.warning": "warning",
  "validation.warnings": "warnings",

  // Settings
  "settings.title": "Settings",
  "settings.close": "Close",

  // Settings: Appearance
  "settings.appearance": "Appearance",
  "settings.theme": "Color theme",
  "settings.colorTheme": "Color theme",
  "settings.themeDark": "Dark",
  "settings.themeLight": "Light",
  "settings.themes.dark": "Dark",
  "settings.themes.light": "Light",
  "settings.themes.nord": "Nord",
  "settings.themes.dracula": "Dracula",
  "settings.themes.solarized-light": "Solarized Light",
  "settings.themes.monochrome": "Monochrome",
  "settings.themes.high-contrast": "High Contrast",
  "settings.display": "Display",
  "settings.fontSize": "Font size (px)",
  "settings.compactMode": "Compact mode (reduced padding)",

  // Settings: General
  "settings.general": "General",
  "settings.autoSave": "Auto-save",
  "settings.enableAutoSave": "Enable auto-save",
  "settings.interval": "Interval (seconds)",
  "settings.language": "Language & Hints",
  "settings.displayLanguage": "Display language",
  "settings.showHints": "Show translation hints",
  "settings.resolveTitles": "Show translated titles in sidebar and flow graph",
  "settings.defaults": "New Mission Defaults",
  "settings.defaultTranslated": "Translated by default",
  "settings.defaultAlignment": "Default alignment",

  // Settings: Editor
  "settings.editor": "Editor",
  "settings.behavior": "Behavior",
  "settings.advancedFields": "Show advanced objective fields (sounds, spawn/death messages)",
  "settings.showMissionIds": "Show mission IDs in sidebar",
  "settings.confirmDelete": "Confirm before deleting missions",
  "settings.variantSimulator": "Show variant simulator (test which variant a player would see)",
  "settings.export": "Export",
  "settings.jsonIndent": "JSON indent spaces",
  "settings.powerLevel.title": "Power Level Preview",
  "settings.powerLevel.show": "Show estimated power level on kill objectives",
  "settings.powerLevel.conStatInc": "HP per attribute point",
  "settings.powerLevel.bpMode": "Squared BP display mode",
  "settings.powerLevel.hint": "The mod doesn't store stats on enemies, just max HP. It back-converts HP into a player-equivalent attribute count using this ratio (Saiyan class 0 CON gives 0.5 HP per point by default), then sums all five stat weights as if every stat matched that count.",

  // Settings: Data
  "settings.clearRecent": "Clear Recent Files",
  "settings.clearAutoSave": "Clear Auto-save Data",

  // Export preview
  "export.title": "Export Preview",
  "export.close": "Close",
  "export.preview": "Preview",
  "export.diff": "Diff",
  "export.noChanges": "No changes from saved version",

  // Templates
  "template.title": "New Mission from Template",
  "template.close": "Close",
  "template.rewardPresets": "Reward Presets",
  "template.alignTpFixed": "3-Align TP (Fixed)",
  "template.alignTpFixedDesc": "150 TP with Good/Neutral/Evil",
  "template.alignTpLevel": "3-Align TP (Level)",
  "template.alignTpLevelDesc": "10x level TP with alignment",
  "template.nothing": "Nothing (transition)",
  "template.nothingDesc": "No reward, just advance",
};

export type Translation = typeof en;
export default en;
