import { Alert, Badge, Box, Center, Code, Text } from "@mantine/core";
import { useUserAgent } from "@oieduardorabelo/use-user-agent";
import { IconInfoCircle } from "@tabler/icons-react";

export const UnavailableApp = () => {
  const details = useUserAgent();
  return (
    <Center h={500}>
      <Box>
        <Badge mb={20}>{__COMMIT_HASH__}</Badge>
        <Text>Votre navigateur n'est pas compatible avec cette app.</Text>
        <Text>
          Essayez avec la dernière versio de Chrome, Edge, Brave ou Opera sur
          desktop.
        </Text>
        {details?.browser?.name === "Chrome" && (
          <Alert mt={20} icon={<IconInfoCircle />}>
            <Text>
              Vous utilisez <b>Brave Browser</b> ?
            </Text>
            <Text>
              Vous pouvez utiliser Lunii Admin Web en activant{" "}
              <b>Filesystem Access Api</b> dans les Flags Brave :
            </Text>
            <Text>
              <ul>
                <li>
                  Tappez <Code>brave://flags/#file-system-access-api</Code> dans
                  votre barre d'url
                </li>
                <li>Activez le flag</li>
                <li>Rechargez Brave</li>
              </ul>
            </Text>
          </Alert>
        )}
      </Box>
    </Center>
  );
};
