import { modals } from "@mantine/modals";
import { InvalidJournalError } from "../utils/lunii/transactions";
import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconBook2,
  IconPlugConnected,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPacksQuery,
  useDiscardJournalMutation,
  useRecoverMutation,
  useRecoveryQuery,
  useOtherWriterQuery,
} from "../queries";
import { state } from "../store";
import { errorMessage } from "../device-operations";
import { Header } from "./Header";
import { InstallModal } from "./InstallModal";
import { Pack } from "./Pack";
export const ConnectedApp = () => {
  const [search, setSearch] = useState("");
  const packs = useGetPacksQuery();
  const recovery = useRecoveryQuery();
  const recover = useRecoverMutation();
  const otherWriter = useOtherWriterQuery(!!recovery.data);
  const discardJournal = useDiscardJournalMutation();
  const device = state.device.use();
  const busy = state.isWriting.use();
  const client = useQueryClient();
  const blocked =
    recovery.isPending || !!recovery.data || recovery.isError || packs.isError;
  const query = search.trim().toLocaleLowerCase("fr");
  const visible =
    packs.data
      ?.map((pack, position) => ({ pack, position }))
      .filter(({ pack }) =>
        `${pack.metadata?.title || ""} ${pack.metadata?.description || ""} ${pack.uuid}`
          .toLocaleLowerCase("fr")
          .includes(query),
      ) || [];
  return (
    <section className="library">
      {import.meta.env.DEV &&
        state.connectionId.peek().startsWith("lunii-demo-") && (
          <Alert mb="lg" color="blue">
            Démonstration : aucune Lunii physique n’est connectée.
          </Alert>
        )}
      <Group justify="space-between" align="flex-start" mb="xl">
        <div>
          <Group gap="xs" mb="sm">
            <Badge
              variant="light"
              leftSection={<IconPlugConnected size={13} />}
            >
              Lunii {device?.version} connectée
            </Badge>
            {busy && (
              <Badge variant="outline" leftSection={<Loader size={10} />}>
                Écriture en cours
              </Badge>
            )}
          </Group>
          <Title order={1}>Mes histoires</Title>
          <Text c="dimmed" mt={6}>
            {packs.data
              ? `${packs.data.length} pack${packs.data.length > 1 ? "s" : ""} sur votre Lunii`
              : "Votre bibliothèque personnelle"}
          </Text>
        </div>
        <Button
          variant="subtle"
          color="gray"
          size="sm"
          disabled={busy}
          onClick={() => {
            state.luniiHandle.set(null);
            state.device.set(null);
            client.clear();
          }}
        >
          Changer de Lunii
        </Button>
      </Group>
      {device?.version === "V2" && !device.stable && (
        <Alert color="orange" mb="lg" title="Modèle expérimental">
          Ce modèle n’a pas été entièrement validé. Conservez une sauvegarde de
          son contenu.
        </Alert>
      )}
      {recovery.data && (
        <Alert
          color="orange"
          title={
            otherWriter.data
              ? "Une opération est en cours dans une autre fenêtre"
              : "Une opération a été interrompue"
          }
          mb="lg"
        >
          <Text size="sm">
            {otherWriter.data
              ? "Attendez la fin de cette opération avant d’utiliser cette fenêtre."
              : recovery.data.kind === "install"
                ? "La récupération conserve les packs déjà indexés et retire les fichiers d’installation incomplets."
                : "La récupération termine la suppression demandée."}{" "}
            Gardez la Lunii branchée.
          </Text>
          <Button
            mt="sm"
            color="orange"
            loading={recover.isPending}
            disabled={
              !!otherWriter.data ||
              otherWriter.isPending ||
              (busy && !recover.isPending)
            }
            onClick={() => recover.mutate()}
          >
            Récupérer l’opération
          </Button>
        </Alert>
      )}
      {recovery.isError && (
        <Alert color="red" title="Vérification de la Lunii impossible" mb="lg">
          {errorMessage(recovery.error)}
          {recovery.error instanceof InvalidJournalError && (
            <Button
              mt="sm"
              color="red"
              variant="outline"
              loading={discardJournal.isPending}
              disabled={busy && !discardJournal.isPending}
              onClick={() =>
                modals.openConfirmModal({
                  title: "Effacer le journal illisible ?",
                  children: (
                    <Text size="sm">
                      Seul le journal sera effacé. Les fichiers des packs et
                      leur ordre resteront inchangés. Vérifiez ensuite votre
                      bibliothèque : une ancienne opération peut être
                      incomplète.
                    </Text>
                  ),
                  labels: { confirm: "Effacer le journal", cancel: "Annuler" },
                  confirmProps: { color: "red" },
                  onConfirm: () => discardJournal.mutate(),
                })
              }
            >
              Effacer le journal illisible
            </Button>
          )}
          <Button
            display="block"
            mt="sm"
            variant="light"
            color="red"
            disabled={busy}
            onClick={() => recovery.refetch()}
          >
            Réessayer
          </Button>
        </Alert>
      )}
      <Header blocked={blocked || packs.isPending} />
      <Group justify="space-between" className="search-row">
        <TextInput
          aria-label="Rechercher un pack"
          placeholder="Rechercher une histoire…"
          leftSection={<IconSearch size={18} />}
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className="search-input"
        />
        <Button
          variant="subtle"
          color="gray"
          leftSection={<IconRefresh size={16} />}
          loading={packs.isFetching && !packs.isPending}
          disabled={busy}
          onClick={() => {
            void packs.refetch();
            void recovery.refetch();
          }}
        >
          Actualiser
        </Button>
      </Group>
      {query && (
        <Text size="sm" c="dimmed" mb="md">
          {visible.length} résultat{visible.length > 1 ? "s" : ""}. Effacez la
          recherche pour réordonner les packs.
        </Text>
      )}
      {packs.isPending ? (
        <Stack aria-label="Chargement des histoires">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} h={110} radius="md" />
          ))}
        </Stack>
      ) : packs.isError ? (
        <Alert color="red" title="Impossible de lire les histoires">
          {errorMessage(packs.error)}
          <Text size="sm" mt="sm">
            Vérifiez le câble USB et l’accès au dossier, puis actualisez la
            bibliothèque.
          </Text>
        </Alert>
      ) : visible.length ? (
        <div className="pack-list">
          {visible.map(({ pack, position }) => (
            <Pack
              key={pack.uuid}
              pack={pack}
              position={position}
              total={packs.data.length}
              blocked={blocked}
              filtered={!!query}
            />
          ))}
        </div>
      ) : (
        <Paper className="empty-library" withBorder>
          <IconBook2 size={42} stroke={1.3} />
          <Title order={2} size="h3" mt="md">
            {query
              ? "Aucune histoire ne correspond"
              : "La prochaine histoire commence ici"}
          </Title>
          <Text c="dimmed" mt="xs">
            {query
              ? "Essayez un autre titre ou effacez la recherche."
              : "Installez votre premier pack au format ZIP STUdio."}
          </Text>
          {query && (
            <Button variant="light" mt="lg" onClick={() => setSearch("")}>
              Effacer la recherche
            </Button>
          )}
        </Paper>
      )}
      <InstallModal />
    </section>
  );
};
