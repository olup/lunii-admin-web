type LuniiDbEntry = {
  uuid: string;
  localized_infos: {
    fr_FR: {
      description: string;
      title: string;
    };
  };
};

export async function getLuniiStoreDb() {
  console.log("Fetching db from lunii store");

  const createResponse = await fetch(
    "https://server-auth-prod.lunii.com/guest/create"
  );
  const createData = await createResponse.json();
  const token = createData.response.token.server;

  const dataResponse = await fetch(
    "https://server-data-prod.lunii.com/v2/packs",
    {
      headers: {
        "X-AUTH-TOKEN": token,
      },
    }
  );

  const response = await dataResponse.json();
  const list: LuniiDbEntry[] = Object.values(response.response);
  return list;
}
