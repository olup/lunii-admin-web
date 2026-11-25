import { expect, test } from "@playwright/test";
import JSZip from "jszip";

function wav() {
  const buffer = Buffer.alloc(44 + 4410 * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(44100, 24);
  buffer.writeUInt32LE(88200, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(buffer.length - 44, 40);
  buffer.writeInt16LE(-1, 44);
  buffer.writeInt16LE(-16, 46);
  return buffer;
}

test("production build installs a ZIP with image and WAV through the complete UI", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const zip = new JSZip();
  const uuid = "00000000-0000-0000-0000-000000000010";
  zip.file(
    "story.json",
    JSON.stringify({
      uuid,
      title: "Pack de vérification",
      description: "Image et son de test",
      version: 1,
      actionNodes: [{ id: "action", options: [uuid] }],
      stageNodes: [
        {
          uuid,
          image: "cover.png",
          audio: "sound.wav",
          okTransition: null,
          homeTransition: null,
          controlSettings: {
            wheel: true,
            ok: true,
            home: true,
            pause: true,
            autoplay: false,
          },
        },
      ],
    }),
  );
  zip.file("assets/sound.wav", wav());
  zip.file(
    "assets/cover.png",
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  const archive = await zip.generateAsync({ type: "base64" });
  await page.goto("/");
  await page.evaluate(async (archive) => {
    const root = await navigator.storage.getDirectory();
    const name = `lunii-production-test-${crypto.randomUUID()}`;
    const device = await root.getDirectoryHandle(name, { create: true });
    await device.getDirectoryHandle(".content", { create: true });
    await device.getFileHandle(".pi", { create: true });
    const md = new Uint8Array(512);
    new DataView(md.buffer).setUint16(0, 3, true);
    const file = await device.getFileHandle(".md", { create: true });
    const writer = await file.createWritable();
    await writer.write(md);
    await writer.close();
    window.showDirectoryPicker = async () => device;
    const bytes = Uint8Array.from(atob(archive), (char) => char.charCodeAt(0));
    const zip = new File([bytes], "test.zip", { type: "application/zip" });
    window.showOpenFilePicker = async () => [
      {
        kind: "file",
        name: "test.zip",
        getFile: async () => zip,
      } as FileSystemFileHandle,
    ];
    window.addEventListener("pagehide", () => {
      void root.removeEntry(name, { recursive: true });
    });
  }, archive);
  await page.getByRole("button", { name: "Connecter ma Lunii" }).click();
  await expect(
    page.getByRole("heading", { name: "Mes histoires" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Installer des packs", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Retour à mes histoires" }),
  ).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole("dialog")).toContainText(
    "Vos histoires sont prêtes",
  );
  await expect(
    page.getByText("Installé sur la Lunii", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retour à mes histoires" }).click();
  await expect(
    page.getByRole("button", { name: "Pack de vérification", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Pack de vérification", exact: true })
    .click();
  await expect(
    page.getByRole("img", { name: "Première image du pack" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
