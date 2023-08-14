import { Center, Container, Loader, Space, Text } from "@mantine/core";
import {
  useGetPacksQuery,
  useRemovePackMutation,
  useReorderPackMutation,
} from "../queries";
import { state } from "../store";
import { Header } from "./Header";
import { InstallModal } from "./InstallModal";
import { Pack } from "./Pack";

export const ConnectedApp = () => {
  const isFfmpegLoaded = state.isFfmpegLoaded.use();

  const { data } = useGetPacksQuery();

  const { mutate: movePack } = useReorderPackMutation();

  const { mutate: removePack } = useRemovePackMutation();

  if (!isFfmpegLoaded)
    return (
      <Center h={400} style={{ flexDirection: "column" }}>
        <Text mb={20}>Encore un instant pour charger les dépendances...</Text>
        <Loader />
      </Center>
    );

  return (
    <>
      <Container>
        <Header />
        <Space h={10} />
        {data?.map((pack, i) => (
          <Pack
            key={pack.uuid}
            pack={pack}
            onMoveUp={() => movePack({ from: i, to: i - 1 })}
            onMoveDown={() => movePack({ from: i, to: i + 1 })}
            onRemove={() => removePack(pack.uuid)}
          />
        ))}
      </Container>
      <InstallModal />
    </>
  );
};
