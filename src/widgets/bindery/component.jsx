import { useTranslation } from "next-i18next/pages";

import Block from "components/services/widget/block";
import Container from "components/services/widget/container";
import useWidgetAPI from "utils/proxy/use-widget-api";
import withWidgetFields from "utils/widget-fields";

const BINDERY_DEFAULT_FIELDS = ["wanted", "queued", "books"];

export default function Component({ service: configuredService }) {
  const { t } = useTranslation();

  const service = withWidgetFields(configuredService, BINDERY_DEFAULT_FIELDS);
  const { widget } = service;

  const { data: wantedData, error: wantedError } = useWidgetAPI(widget, "wanted");
  const { data: queueData, error: queueError } = useWidgetAPI(widget, "queue");
  const { data: booksData, error: booksError } = useWidgetAPI(widget, "books");

  if (wantedError || queueError || booksError) {
    const finalError = wantedError ?? queueError ?? booksError;
    return <Container service={service} error={finalError} />;
  }

  if (!wantedData || !queueData || !booksData) {
    return (
      <Container service={service}>
        <Block label="bindery.wanted" />
        <Block label="bindery.queued" />
        <Block label="bindery.books" />
      </Container>
    );
  }

  return (
    <Container service={service}>
      <Block label="bindery.wanted" value={t("common.number", { value: wantedData.total })} />
      <Block label="bindery.queued" value={t("common.number", { value: queueData.totalRecords })} />
      <Block label="bindery.books" value={t("common.number", { value: booksData.total })} />
    </Container>
  );
}
