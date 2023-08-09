import { Container } from "@mantine/core";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { state } from "../store";
import { changePackPosition, getPacksMetadata } from "../utils/lunii/packs";
import { Pack } from "./Pack";
import { Header } from "./Header";

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

  return (
    <Container>
      <Header />
      {data?.map((pack, i) => (
        <Pack
          key={pack.uuid}
          pack={pack}
          onMoveUp={() => movePack({ from: i, to: i - 1 })}
          onMoveDown={() => movePack({ from: i, to: i + 1 })}
        />
      ))}
    </Container>
  );
};
