import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  const commonMessages = (await import(`./messages/en/common.json`))
    .default;
  const personalMessages = (await import(`./messages/en/personal.json`))
    .default;
  const collectionsMessages = (
    await import(`./messages/en/collections.json`)
  ).default;
  return {
    locale: "en",
    messages: {
      ...commonMessages,
      ...personalMessages,
      ...collectionsMessages,
    },
  };
});
