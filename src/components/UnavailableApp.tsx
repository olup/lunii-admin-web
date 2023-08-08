import { Container, Text } from "@mantine/core";

export const UnavailableApp = () => {
  return (
    <Container>
      <Text>Votre navigateur n'est pas compatible avec cette app.</Text>
      <Text>Essayez avec la dernière versio de Chrome, sur desktop.</Text>
    </Container>
  );
};
