import { expect, test } from "@playwright/test";

test("connect screen, theme, cancellation and narrow viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Connecter votre Lunii" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.showDirectoryPicker = async () => {
      throw new DOMException("Cancelled", "AbortError");
    };
  });
  await page.getByRole("button", { name: "Connecter ma Lunii" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByRole("button", { name: "Activer le thème sombre" }).click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mantine-color-scheme",
    "dark",
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-mantine-color-scheme",
    "dark",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("library edits, search, reorder and delete use the real browser filesystem", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?demo=1");
  await expect(
    page.getByRole("heading", { name: "Mes histoires" }),
  ).toBeVisible();
  await expect(page.locator(".pack-row")).toHaveCount(4);
  await expect(
    page.getByRole("button", {
      name: "Monter La forêt des petits secrets",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Monter Un voyage jusqu’à la Lune",
      exact: true,
    })
    .click();
  await expect(page.locator(".pack-title").first()).toHaveText(
    "Un voyage jusqu’à la Lune",
  );
  await page.getByRole("textbox", { name: "Rechercher un pack" }).fill("forêt");
  await expect(page.locator(".pack-row")).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Monter La forêt des petits secrets",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "La forêt des petits secrets", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill("La forêt enchantée");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enregistrer", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "La forêt enchantée", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Rechercher un pack" }).fill("");
  await page
    .getByRole("button", { name: "Actions pour La forêt enchantée" })
    .click();
  await page.getByRole("menuitem", { name: "Supprimer" }).click();
  await page
    .getByRole("button", { name: "Supprimer le pack", exact: true })
    .click();
  await expect(page.locator(".pack-row")).toHaveCount(3);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("empty state and cancelled install", async ({ page }) => {
  await page.goto("/?demo=empty");
  await expect(
    page.getByRole("heading", { name: "La prochaine histoire commence ici" }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.showOpenFilePicker = async () => {
      throw new DOMException("Cancelled", "AbortError");
    };
  });
  await page
    .getByRole("button", { name: "Installer des packs", exact: true })
    .click();
  await expect(page.getByText("Opération non terminée")).toHaveCount(0);
});

test("Tetris runs on React 19 and stays inside the installation dialog", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?demo=1");
  await expect(
    page.getByRole("heading", { name: "Mes histoires" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    // Vite serves this module only in the development test server.
    const { demoState: state } = await import(
      /* @vite-ignore */ "/src/dev/fixture.ts"
    );
    state.installation.packInstallationProgress.totalCount.set(1);
    state.installation.step.set("COPYING");
    state.installation.isInstalling.set(true);
  });
  await page
    .getByRole("button", { name: "Un peu de Tetris en attendant ?" })
    .click();
  const board = page.getByRole("group", { name: /^Tetris :/ });
  await expect(board.locator("td")).toHaveCount(200);
  await board.focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByText(/points · En pause/)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Masquer Tetris" }).click();
  await expect(board).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("an interrupted install can be recovered without changing indexed packs", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await expect(page.locator(".pack-row")).toHaveCount(4);
  await page.evaluate(async () => {
    const { demoState: state } = await import(
      /* @vite-ignore */ "/src/dev/fixture.ts"
    );
    const handle = state.luniiHandle.peek();
    const content = await handle.getDirectoryHandle(".content");
    await content.getDirectoryHandle("00000009", { create: true });
    const file = await handle.getFileHandle(".lunii-admin-operation.json", {
      create: true,
    });
    const writer = await file.createWritable();
    await writer.write(
      JSON.stringify({
        kind: "install",
        uuid: "00000000-0000-0000-0000-000000000009",
      }),
    );
    await writer.close();
  });
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Installer des packs" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Récupérer l’opération" }).click();
  await expect(
    page.getByRole("button", { name: "Récupérer l’opération" }),
  ).toHaveCount(0);
  await expect(page.locator(".pack-row")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Installer des packs" }),
  ).toBeEnabled();
});

test("another tab holding the write lock prevents conflicting device mutations", async ({
  page,
  context,
}) => {
  await page.goto("/?demo=1");
  await expect(page.locator(".pack-row")).toHaveCount(4);
  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate(() => {
    void navigator.locks.request(
      "lunii-admin-device-write",
      () =>
        new Promise<void>((resolve) =>
          addEventListener("release-test-lock", () => resolve(), {
            once: true,
          }),
        ),
    );
  });
  await expect
    .poll(() =>
      other.evaluate(async () =>
        (await navigator.locks.query()).held?.some(
          (lock) => lock.name === "lunii-admin-device-write",
        ),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", {
      name: "Monter Un voyage jusqu’à la Lune",
      exact: true,
    })
    .click();
  await expect(
    page.getByText(
      "Une autre fenêtre modifie une Lunii. Attendez la fin de cette opération.",
    ),
  ).toBeVisible();
  await expect(page.locator(".pack-title").first()).toHaveText(
    "La forêt des petits secrets",
  );
  await other.evaluate(() => dispatchEvent(new Event("release-test-lock")));
  await other.close();
});

test("Escape dismisses unsaved confirmation without reopening it", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page
    .getByRole("button", { name: "La forêt des petits secrets", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill("Modification non enregistrée");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Continuer à modifier" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Continuer à modifier" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Titre", exact: true }),
  ).toHaveValue("Modification non enregistrée");
});

test("audio conversion loads the real worker, rejects invalid audio and can retry", async ({
  page,
}) => {
  test.setTimeout(150_000);
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { convertAudioToMP3 } = await import(
      /* @vite-ignore */ "/src/utils/converters/audio.ts"
    );
    const { readMP3Header } = await import(
      /* @vite-ignore */ "/src/utils/mp3.ts"
    );
    const buffer = new ArrayBuffer(44 + 4410 * 2);
    const view = new DataView(buffer);
    const text = (offset: number, value: string) =>
      [...value].forEach((char, i) =>
        view.setUint8(offset + i, char.charCodeAt(0)),
      );
    text(0, "RIFF");
    view.setUint32(4, buffer.byteLength - 8, true);
    text(8, "WAVE");
    text(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 44100, true);
    view.setUint32(28, 88200, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, "data");
    view.setUint32(40, buffer.byteLength - 44, true);
    // This sample pair fooled the former MP3 sniffing shortcut inside a WAV.
    view.setInt16(44, -1, true);
    view.setInt16(46, -16, true);
    const wav = new File([buffer], "sample.wav", { type: "audio/wav" });
    const first = await convertAudioToMP3(wav);
    let failed = false;
    try {
      await convertAudioToMP3(
        new File(["invalid audio"], "bad.ogg", { type: "audio/ogg" }),
      );
    } catch {
      failed = true;
    }
    const second = await convertAudioToMP3(wav);
    return {
      first: readMP3Header(first),
      second: readMP3Header(second),
      failed,
    };
  });
  expect(result).toEqual({
    first: { channelCount: 1, frameRate: 44100 },
    second: { channelCount: 1, frameRate: 44100 },
    failed: true,
  });
});

test("invalid pack metadata stays isolated and requires consent before replacement", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await expect(page.locator(".pack-row")).toHaveCount(4);
  await page.evaluate(async () => {
    const { demoState } = await import(
      /* @vite-ignore */ "/src/dev/fixture.ts"
    );
    const content = await demoState.luniiHandle
      .peek()
      .getDirectoryHandle(".content");
    const pack = await content.getDirectoryHandle("00000001");
    const stream = await (await pack.getFileHandle("md")).createWritable();
    await stream.write("");
    await stream.close();
  });
  await page.getByRole("button", { name: "Actualiser", exact: true }).click();
  await expect(page.locator(".pack-row")).toHaveCount(4);
  await page
    .getByRole("button", {
      name: "Histoire sans titre · 00000001",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill("Titre récupéré");
  await expect(
    page.getByRole("button", { name: "Enregistrer", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("checkbox", {
      name: "Remplacer les informations illisibles par ce titre et cette description",
    })
    .check();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enregistrer", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Titre récupéré", exact: true }),
  ).toBeVisible();
});

test("failed metadata save keeps the entered text and allows a retry", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page
    .getByRole("button", { name: "La forêt des petits secrets", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Titre", exact: true })
    .fill("Texte à conserver");
  await page.evaluate(async () => {
    const { demoState } = await import(
      /* @vite-ignore */ "/src/dev/fixture.ts"
    );
    Object.defineProperty(demoState.luniiHandle.peek(), "getDirectoryHandle", {
      configurable: true,
      value: async () => {
        throw new DOMException("Écriture indisponible", "NotAllowedError");
      },
    });
  });
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByText("Enregistrement impossible", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Titre", exact: true }),
  ).toHaveValue("Texte à conserver");
  await page.evaluate(async () => {
    const { demoState } = await import(
      /* @vite-ignore */ "/src/dev/fixture.ts"
    );
    Reflect.deleteProperty(demoState.luniiHandle.peek(), "getDirectoryHandle");
  });
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enregistrer", exact: true }),
  ).toBeDisabled();
});
