import { Center, Overlay, Paper, Space, Text } from "@mantine/core";
import { state } from "../store";

export const InstallModal = () => {
  const opened = state.installation.isInstalling.use();
  const title = state.installation.pack.title.use();

  if (opened)
    return (
      <Overlay color="#fff" blur={3}>
        <Space h={100} />
        <Center>
          {title ? (
            <Paper shadow="md" p="lg" radius="sm" w={500} withBorder>
              <Text>Installation du pack</Text>
              <Text>{title}</Text>
            </Paper>
          ) : null}
        </Center>
      </Overlay>
    );
  else return null;
};
