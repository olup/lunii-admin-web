import { Badge, Container, Text } from "@mantine/core";

export const UnavailableApp = () => {
  return (
    <Container>
      <Badge mb={20}>{__COMMIT_HASH__}</Badge>
      <Text>Votre navigateur n'est pas compatible avec cette app.</Text>
      <Text>Essayez avec la dernière versio de Chrome, sur desktop.</Text>
    </Container>
  );
};
