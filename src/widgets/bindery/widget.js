import { asJson } from "utils/proxy/api-helpers";
import genericProxyHandler from "utils/proxy/handlers/generic";

// Bindery's book list is paginated and reports the unpaged `total` alongside
// the page, so each count is fetched as a one row page rather than the whole
// library. `status=wanted` additionally requires monitored books, matching
// what the Wanted page shows.
const bookTotal = (data) => ({ total: asJson(data)?.total ?? 0 });

const widget = {
  // Bindery serves the Sonarr/Radarr style queue at /api/queue, outside the
  // /api/v1 tree the rest of the API lives in, so the version is part of the
  // endpoint rather than the base.
  api: "{url}/api/{endpoint}?apikey={key}",
  proxyHandler: genericProxyHandler,

  mappings: {
    wanted: {
      endpoint: "v1/book?status=wanted&limit=1",
      map: bookTotal,
      validate: ["total"],
    },
    books: {
      endpoint: "v1/book?status=imported&limit=1",
      map: bookTotal,
      validate: ["total"],
    },
    queue: {
      endpoint: "queue?pageSize=1",
      validate: ["totalRecords"],
    },
  },
};

export default widget;
