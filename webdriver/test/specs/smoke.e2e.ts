import { expect } from "chai";

// The lightest possible check that tauri-driver attaches to the window and
// the React app is alive. Anything beyond this can assume the bundle JS
// loaded and i18n initialized.

describe("smoke", () => {
  it("renders the toolbar with the standard buttons", async () => {
    // Wait for at least one toolbar button to be present. The toolbar is
    // the first thing rendered, so this also serves as our app-ready
    // signal for subsequent tests in the same session.
    const newButton = await $("button=New");
    await newButton.waitForDisplayed({ timeout: 10_000 });
    expect(await newButton.isDisplayed()).to.equal(true);

    const open = await $("button=Open");
    expect(await open.isDisplayed()).to.equal(true);

    const settings = await $("button=Settings");
    expect(await settings.isDisplayed()).to.equal(true);
  });

  it("starts with no bundle loaded (empty-state message in the editor area)", async () => {
    const empty = await $(".editor-empty");
    expect(await empty.isDisplayed()).to.equal(true);
    expect(await empty.getText()).to.match(/open|create/i);
  });
});
