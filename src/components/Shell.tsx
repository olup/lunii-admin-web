import {
  ActionIcon,
  Anchor,
  Container,
  Group,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import { IconBrandGithub, IconMoon, IconSun } from "@tabler/icons-react";
import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const scheme = useComputedColorScheme("light");
  const { setColorScheme } = useMantineColorScheme();
  return (
    <div className="app-shell">
      <header className="site-header">
        <Container size="lg">
          <Group justify="space-between">
            <Text fw={600} size="lg">
              Lunii Admin Web
            </Text>
            <Group gap="xs">
              <Tooltip
                label={scheme === "dark" ? "Thème clair" : "Thème sombre"}
              >
                <ActionIcon
                  aria-label={
                    scheme === "dark"
                      ? "Activer le thème clair"
                      : "Activer le thème sombre"
                  }
                  variant="subtle"
                  color="gray"
                  size="lg"
                  onClick={() =>
                    setColorScheme(scheme === "dark" ? "light" : "dark")
                  }
                >
                  {scheme === "dark" ? (
                    <IconSun size={19} />
                  ) : (
                    <IconMoon size={19} />
                  )}
                </ActionIcon>
              </Tooltip>
              <ActionIcon
                component="a"
                href="https://github.com/olup/lunii-admin-web"
                target="_blank"
                rel="noreferrer"
                aria-label="Code source sur GitHub"
                variant="subtle"
                color="gray"
                size="lg"
              >
                <IconBrandGithub size={20} />
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </header>
      <main>
        <Container size="lg">{children}</Container>
      </main>
      <footer className="site-footer">
        <Container size="lg">
          <Group justify="space-between" gap="sm">
            <Text size="xs">
              Un outil indépendant, créé par Olup et la communauté Lunii.
            </Text>
            <Group gap="md">
              <Anchor
                size="xs"
                c="dimmed"
                href="https://github.com/olup/lunii-admin-web"
                target="_blank"
                rel="noreferrer"
              >
                À propos
              </Anchor>
              <Text size="xs">Version {__COMMIT_HASH__.trim()}</Text>
            </Group>
          </Group>
        </Container>
      </footer>
    </div>
  );
}
