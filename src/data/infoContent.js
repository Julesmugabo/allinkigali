/**
 * infoContent.js — Plain-language text for the Help and Privacy screens.
 * Written to match what the app really does today; update it when that changes.
 */

export const HELP = {
  title: 'Help & FAQ',
  sections: [
    {
      heading: 'How do I contact a service provider?',
      body: 'Open the Service Market, find a business, and either send a service request or call the number on its page.',
    },
    {
      heading: 'What happens after I send a request?',
      body: 'The business sees it in its dashboard and marks it handled. You can follow its status under Me > My service requests.',
    },
    {
      heading: 'Do I pay through the app?',
      body: 'No. Payment is not built yet. You agree the price and how to pay directly with the business.',
    },
    {
      heading: 'How do I list my business?',
      body: 'Go to Me > Register a business. The platform team reviews it, and your business dashboard opens once it is approved.',
    },
    {
      heading: 'How do I change my password or details?',
      body: 'Use Me > Edit profile and Me > Change password.',
    },
  ],
};

export const PRIVACY = {
  title: 'Terms & privacy',
  sections: [
    {
      heading: 'What we store about you',
      body: 'Your name, email and phone number (phone is optional), and your password in scrambled form that nobody can read back. We also store the service requests you send: the business, the service, the date and your note.',
    },
    {
      heading: 'Who can see it',
      body: 'You can see your own details and requests. A business can see the requests sent to it. The platform team can see requests and accounts in order to run the service.',
    },
    {
      heading: 'What we do not do',
      body: 'We do not sell your details, and we do not handle payments.',
    },
    {
      heading: 'Full terms',
      body: 'Formal terms of use have not been published yet. This page is a plain summary of how the app works today.',
    },
  ],
};
