import { expect } from "chai";

// Drives a full user flow against the real binary: create a new bundle, add
// a mission, edit its title, verify the dirty marker, undo. Doesn't touch
// the filesystem (no real save dialog) so it's safe to run repeatedly.

describe("new bundle flow", () => {
  it("creating a new bundle activates the sidebar and editor", async () => {
    const newButton = await $("button=New");
    await newButton.click();

    // The sidebar should now show the new bundle entry. New bundles default
    // to the name "New Bundle".
    const sidebarBundle = await $(".sidebar-section .sidebar-item-name=New Bundle");
    await sidebarBundle.waitForDisplayed({ timeout: 5_000 });
    expect(await sidebarBundle.isDisplayed()).to.equal(true);

    // Empty state for missions ("No missions yet. Click "+" to create one.")
    const empty = await $(".sidebar-empty");
    expect(await empty.getText()).to.match(/No missions/i);
  });

  it("adding a mission populates the sidebar and the editor switches to it", async () => {
    // Click the "+" button in the Missions section header.
    const addBtn = await $('//div[contains(@class,"sidebar-header")][.//span[contains(text(),"Missions") or contains(text(),"MISSIONS")]]//button[normalize-space()="+"]');
    await addBtn.click();

    // A mission row appears in the list with the default title "New Mission".
    const missionRow = await $(".sidebar-list .sidebar-item-name*=New Mission");
    await missionRow.waitForDisplayed({ timeout: 5_000 });
    expect(await missionRow.isDisplayed()).to.equal(true);

    // The mission editor's title input mirrors the same value.
    const titleInput = await $('input[value="New Mission"]');
    await titleInput.waitForDisplayed({ timeout: 5_000 });
    expect(await titleInput.isDisplayed()).to.equal(true);
  });

  it("typing in the title field flips the toolbar dirty marker", async () => {
    const titleInput = await $('input[value="New Mission"]');
    await titleInput.click();
    // Append a character so we have a deterministic dirty change.
    await browser.keys(["End", "!"]);

    // The toolbar shows a "*" marker (warning-colored) when at least one
    // bundle is dirty.
    const dirty = await $(".toolbar-title span*=*");
    await dirty.waitForExist({ timeout: 5_000 });
    expect(await dirty.isExisting()).to.equal(true);
  });

  it("Ctrl+Z reverts the edit", async () => {
    await browser.keys(["Control", "z"]);

    // The title input should pop back to the original "New Mission" value.
    const reverted = await $('input[value="New Mission"]');
    await reverted.waitForDisplayed({ timeout: 5_000 });
    expect(await reverted.isDisplayed()).to.equal(true);
  });
});
