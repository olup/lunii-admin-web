import { Container, Space } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { state } from "../store";
import {
  changePackPosition,
  getPacksMetadata,
  removePackUuid,
} from "../utils/lunii/packs";
import { Header } from "./Header";
import { Pack } from "./Pack";

export const ConnectedApp = () => {
  const client = useQueryClient();

  const { data } = useQuery(["packs"], () =>
    getPacksMetadata(state.luniiHandle.peek()!)
  );

  const { mutate: movePack } = useMutation({
    mutationKey: "reorderPacks",
    mutationFn: async (options: { from: number; to: number }) =>
      changePackPosition(state.luniiHandle.peek()!, options.from, options.to),
    onSuccess: () => client.invalidateQueries("packs"),
  });

  const { mutate: removePack } = useMutation({
    mutationKey: "reorderPacks",
    mutationFn: async (options: { uuid: string }) =>
      removePackUuid(state.luniiHandle.peek()!, options.uuid),
    onSuccess: () => client.invalidateQueries("packs"),
  });

  return (
    <Container>
      <Header />
      <Space h={10} />
      {data?.map((pack, i) => (
        <Pack
          key={pack.uuid}
          pack={pack}
          onMoveUp={() => movePack({ from: i, to: i - 1 })}
          onMoveDown={() => movePack({ from: i, to: i + 1 })}
          onRemove={() => removePack({ uuid: pack.uuid })}
        />
      ))}
    </Container>
  );
};
