const {Chance} = require("chance");
const chance = new Chance();
const {
  SimpleDao
} = require("btrz-simple-dao");

function getNewAccount() {
  return {
    name: chance.word(),
    domain: "unit.tests",
    email: chance.email(),
    password: "1234567p",
    confirmPassword: "1234567p"
  };
}


function getPaymentProviders() {
  return [
    {
      method: "lucasmethod",
      _id: "TVGQS1X8",
      provider: "inperson",
      params: {},
      ord: 65,
      enabled: false,
      hasRefund: true,
      requireConfirmation: true,
      externalSource: true,
      displayName: "Lucas Method",
      includeInDepositTotals: true,
      custom: true
    },
    {
      method: "masterReferencedPayment",
      _id: "ASDF1234",
      accountId: "",
      provider: "referencedPayment",
      params: {},
      ord: 65,
      enabled: false,
      hasRefund: true,
      requireConfirmation: true,
      externalSource: true,
      displayName: "Lucas Method",
      includeInDepositTotals: true,
      custom: false
    }
  ];
}

function getAccount(id, roles) {
  return {
    getPaymentProviders: () => {
      return getPaymentProviders();
    },
    _id: id || "528cd077f3d73ec2060000b8",
    domain: "betterez",
    name: "Better Rez",
    rootDomain: "betterez.com",
    preferences: {
      customerAccounts: {
        enabled: false,
        customerPhone: false,
        optIn: false,
        optInMessage: "" // Deprecated: #6725
      },
      languages: {
        en: true,
        fr: true,
        de: true,
        nl: true
      },
      commIdentity: [
        {
          name: "Betterez",
          email: "info@betterez.com",
          verified: true,
          active: true
        }
      ],
      colors: {
        mainBackground: "#FFFFFF",
        mainForeground: "#404040",
        brandBackground: "#404040",
        brandForeground: "#FFFFFF",
        complementaryBackground: "#F5F5F5",
        complementaryForeground: "#404040"
      },
      currencies: ["USD"],
      multiCurrency: false,
      supportedCurrencies: [{isocode: "USD", symbol: "$"}],
      dateFormat: "dd/mm/yyyy",
      lexicon: "buscompany",
      manifest: {
        brakePageOnNewLeg: false,
        displayNoShowsPerLeg: false,
        displayBoardingSsrsPerLeg: false
      },
      network: {
        isSeller: false,
        searchableSeller: false,
        isOperator: true,
        searchableOperator: false,
        creditLimits: {
          enabled: false
        }
      },
      optionalShowFields: {
        commentsPerPax: false,
        commentsPerPaxAgency: false,
        commentsPerPaxWidget: false,
        airlineInfoIfAirport: false,
        websalesChannelsForReferencedPayments: false
      },
      rounding: {
        policy: "default",
        decimals: "2"
      },
      sales: {
        enableArbitraryRefunds: false,
        allowReissueToAPastDate: true,
        noTripsCustomMessage: "<br>",
        checkInRequired: false,
        uncheckBaggageWithPax: false,
        boardingPassRequired: false,
        quickView: false,
        passbook: false,
        allowChangeLowerFare: {
          backoffice: false,
          websales: true,
          "agency-backoffice": false,
          "agency-websales": false
        }
      },
      scanningWorkflow: "simple",
      shortUrls: {
        widget: {
          longUrl: "",
          shortUrl: ""
        },
        fullPage: {
          longUrl: "",
          shortUrl: ""
        }
      },
      timeFormat: "HH:MM",
      timeZone: {
        name: "Pacific",
        daylight: true
      },
      workflow: "route",
      connex: {
        minWaitingTime: "2",
        maxWaitingTime: "280",
        enabled: false,
        cache: {
          useCache: false,
          advancedCacheOnSameDay: true,
          numberOfEntryUsage: 100,
          numberOfDaysUsage: 7
        }
      },
      bookingSession: 180,
      bookingSessions: {
        backoffice: 180,
        "agency-backoffice": 180,
        websales: 180,
        "agency-websales": 180
      },
      wl: {
        schema: ""
      },
      hasWlSchema: false,
      pdfTicket: {
        tripName: false,
        dpi: 72,
        pageHeight: 4.8,
        pageWidth: 7.5,
        customSettings: false
      },
      refunds: {
        widget: false,
        callcenter: false
      }
    },
    roles: roles || [
      {
        _id: "widget",
        name: "Widget",
        system: true
      },
      {
        _id: "inactive",
        name: "Inactive",
        system: false
      },
      {
        _id: "driver",
        newId: "driver",
        name: "Driver"
      },
      {
        _id: "agent",
        newId: "agent",
        name: "Agent"
      },
      {
        _id: "administrator",
        newId: "administrator",
        name: "Administrator"
      }
    ],
    deleted: false,
    createdAt: new Date("03/08/2017")
  };
}

function getDefaultUsers(domain, email) {
  return {
    adminUser: {
      _id: SimpleDao.objectId().toString(),
      email,
      password: chance.hash(),
      roles: {administrator: 1},
      domain,
      display: domain,
      rootDomain: "betterez.com",
      firstName: "Admin",
      lastName: "User",
      permissions: {},
      assignableToManifest: false,
      hasAccessToAllManifestsInDriversApp: false,
      color: "#528EBB"
    },
    widgetUser: {
      _id: SimpleDao.objectId().toString(),
      email: `widget.${domain}@betterez.com`,
      password: "s3cr3tw!z@rd",
      domain,
      rootDomain: "betterez.com",
      display: domain,
      roles: {widget: 1},
      firstName: "Widget",
      lastName: "User",
      permissions: {},
      assignableToManifest: false,
      hasAccessToAllManifestsInDriversApp: false,
      color: "#528EBB"
    }
  };
}


exports.getNewAccount = getNewAccount;
exports.getPaymentProviders = getPaymentProviders;
exports.getAccount = getAccount;
exports.getDefaultUsers = getDefaultUsers;
