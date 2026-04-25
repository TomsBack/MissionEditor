import { expect } from "chai";

// Drives a full user flow against the real binary: create a new bundle, add
// a mission, edit its title, verify the dirty marker, undo. Doesn't touch
// the filesystem (no real save dialog) so it's safe to run repeatedly.
//
// Each test starts by clicking New so it's independent of whatever state
// previous tests (or auto-save recovery from a prior run) left around.

async function freshBundle() {
  const newBtn = await $("button=New");
  await newBtn.waitForDisplayed({ timeout: 10_000 });
  await newBtn.click();
}

describe("new bundle flow", () => {
  beforeEach(freshBundle);

  it("the new bundle shows in the sidebar with the default name", async () => {
    // Bundles render under .sidebar-section as .sidebar-item rows; the name
    // sits in a .sidebar-item-name span. Find any row whose name span
    // contains the default "New Bundle" text.
    const row = await $(
      "//div[contains(@class,'sidebar-item')][.//span[contains(@class,'sidebar-item-name') and normalize-space()='New Bundle']]",
    );
    await row.waitForDisplayed({ timeout: 5_000 });
    expect(await row.isDisplayed()).to.equal(true);

    // Empty mission list shows the "no missions yet" prompt.
    const empty = await $(".sidebar-empty");
    expect(await empty.getText()).to.match(/No missions/i);
  });

  it("clicking the + Add Mission button populates the sidebar and editor", async () => {
    // The + button is the first button inside the Missions section header.
    const addBtn = await $(
      "//div[contains(@class,'sidebar-header')][.//span[normalize-space()='Missions']]//button[normalize-space()='+']",
    );
    await addBtn.waitForClickable({ timeout: 5_000 });
    await addBtn.click();

    // The mission editor's title field is an input prefilled with "New Mission".
    const titleInput = await $('input[value="New Mission"]');
    await titleInput.waitForDisplayed({ timeout: 5_000 });
    expect(await titleInput.isDisplayed()).to.equal(true);

    // The same string also shows up in the sidebar mission list.
    const missionRow = await $(
      "//div[contains(@class,'sidebar-item')][.//span[contains(@class,'sidebar-item-name') and contains(normalize-space(),'New Mission')]]",
    );
    await missionRow.waitForDisplayed({ timeout: 5_000 });
    expect(await missionRow.isDisplayed()).to.equal(true);
  });

  it("typing in a mission title flips the toolbar dirty marker", async () => {
    // Add a mission first so we have a title input to edit.
    const addBtn = await $(
      "//div[contains(@class,'sidebar-header')][.//span[normalize-space()='Missions']]//button[normalize-space()='+']",
    );
    await addBtn.waitForClickable({ timeout: 5_000 });
    await addBtn.click();

    const titleInput = await $('input[value="New Mission"]');
    await titleInput.waitForDisplayed({ timeout: 5_000 });
    await titleInput.click();
    await browser.keys(["End", "!"]);

    // The toolbar's dirty marker is a span containing "*", styled with the
    // warning color. It only renders while the bundle has unsaved edits.
    const dirty = await $(
      "//span[contains(@class,'toolbar-title')]/span[normalize-space()='*']",
    );
    await dirty.waitForExist({ timeout: 5_000 });
    expect(await dirty.isExisting()).to.equal(true);
  });
});
